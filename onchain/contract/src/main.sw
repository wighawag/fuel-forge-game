contract;

use std::time::Time;
use std::logging::log;
use std::codec::encode;
use std::bytes::Bytes;
use std::hash::*;
use std::storage::storage_vec::*;

// ----------------------------------------------------------------------------
// EXTERNAL TYPES
// ----------------------------------------------------------------------------

struct Player {
    account: Identity,
    position: Position,
    time: u64,
    life: u64,
    next_bomb: u64
}

struct Bomb {
    position: Position,
    length: u64,
    start: u64,
    end: u64
}

enum Entity {
    Player: Player,
    Bomb: Bomb,
}

struct ZonesInfo {
    time: u64,
    zones:  Vec<Vec<Entity>>,
}
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// EVENT TYPES
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// ERROR TYPES
// ----------------------------------------------------------------------------
#[error_type]
pub enum GameError {
    #[error(m = "Player already in")]
    PlayerAlreadyIn: (),
    #[error(m = "Player not in")]
    PlayerNotIn: (),
    #[error(m = "Bomb Already there")]
    BombAlreadyThere: (),
    #[error(m = "Player is dead")]
    PlayerIsDead: (),
    #[error(m = "Player has already moved")]
    PlayerAlreadyMoved: (),
}
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// ABI
// ----------------------------------------------------------------------------
abi Game {
    // ------------------------------------------------------------------------
    // TODO remove, used for testing only
    // ------------------------------------------------------------------------
    fn identity() -> Identity;
    fn calculate_zone(position: Position) -> u64;
    // ------------------------------------------------------------------------

    // ------------------------------------------------------------------------
    // TODO ADMIN / DEBUGGING
    // ------------------------------------------------------------------------
    #[storage(write, read)]
    fn increase_time(seconds: u64);

    #[storage(read)]
    fn get_time() -> u64;
    // ------------------------------------------------------------------------
    #[storage(write, read)]
    fn enter();

    #[storage(write, read)]
    fn move(new_position: Position, i: u64);

    #[storage(write, read)]
    fn place_bomb();

    #[storage(read)]
    fn position(identity: Identity) -> Option<Position>;

    #[storage(read)]
    fn get_zones(zones: Vec<u64>) -> ZonesInfo;
}
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// STORAGE TYPES
// ----------------------------------------------------------------------------

struct Position {
    x: u64,
    y: u64
}

impl Hash for Position {
    fn hash(self, ref mut hasher: Hasher) {
        self.x.hash(hasher);
        self.y.hash(hasher);
    }
}


impl PartialEq for Position {
    fn eq(self, other: Self) -> bool {
        self.x == other.x && self.y == other.y
    }
}
struct PlayerInStorage {
    position: Position,
    time: u64,
    zone_list_index: u64,
    life: u64,
    next_bomb: u64
}

struct TileInStorage {
    is_bomb_tile: bool,
    explosion_start: u64,
    explosion_end: u64
}

enum Link {
    Player: Identity,
    Tile: Position,
}

// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// STORAGE
// ----------------------------------------------------------------------------
storage {
    // ------------------------------------------------------------------------
    // TODO ADMIN / DEBUGGING
    // ------------------------------------------------------------------------
    time_delta: u64 = 0,
    // ------------------------------------------------------------------------
    players: StorageMap<Identity, PlayerInStorage> = StorageMap {},
    zones: StorageMap<u64, StorageVec<Link>> = StorageMap {},
    tiles: StorageMap<Position, TileInStorage> = StorageMap {},
}
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// CONSTANTS AND CONFIGURABLES
// ----------------------------------------------------------------------------
const ENTRANCE = Position {x: 1 << 30, y: 1 << 30}; // Start somwhere high enough
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// INTERNAL FUNCTIONS
// ----------------------------------------------------------------------------
#[storage(read)]
fn _time() -> u64 {
    const TAI_64_CONVERTER: u64 = 10 + (1 << 62);
    Time::now().as_tai64() - TAI_64_CONVERTER  + storage.time_delta.try_read().unwrap_or(0)
}

fn _calculate_zone(position: Position) -> u64 {
    // Define zone size (how many position units per zone)
    // Using power of 2 for efficient division
    let zone_size: u64 = 63;
    let half_zone: u64 = zone_size / 2;
    
    // Add half_zone to center zones around entrance position
    // This ensures entrance ± half_zone are in the same zone
    let x_zone: u64 = (position.x + half_zone) / zone_size;
    let y_zone: u64 = (position.y + half_zone) / zone_size;
    
    // Calculate a unique zone index using bit manipulation
    // This creates a unique number for each (x,y) zone coordinate pair
    // Using 32 bits for each coordinate (more than enough for game zones)
    // Zone index = (y_zone << 32) | x_zone
    (y_zone << 32) | x_zone
}

#[storage(read)]
fn _get_player(account: Identity) -> Option<PlayerInStorage> {
    let time = _time();
    let p = storage.players.get(account).try_read();
    match p {
        Option::Some(p) => Option::Some(_update_player_for_explosion(p, time)),
        Option::None => Option::None,
    }
}

#[storage(read)]
fn _get_tile(position: Position) -> Option<TileInStorage> {
    storage.tiles.get(position).try_read()
}

#[storage(read, write)]
fn _add_player_to_zone(account: Identity, new_zone: u64) -> u64 {
    let index = storage.zones.get(new_zone).len();
    storage.zones.get(new_zone).push(Link::Player(account));
    index
}
#[storage(read, write)]
fn _remove_player_from_zone(old_zone: u64, old_index: u64) {
    let length = storage.zones.get(old_zone).len();
    if old_index == length -1 {
        let _ = storage.zones.get(old_zone).pop();
    } else {
        let link_at_the_end = storage.zones.get(old_zone).pop().unwrap();
        match link_at_the_end {
            Link::Player(account_at_the_end) => {
                let mut player_at_the_end = storage.players.get(account_at_the_end).try_read().unwrap();
                player_at_the_end.zone_list_index = old_index;
                storage.players.insert(account_at_the_end, player_at_the_end);        
            },
            Link::Tile(tile_position_at_the_end) => {},
        }
        
        storage.zones.get(old_zone).set(old_index, link_at_the_end);
    }
}

#[storage(read, write)]
fn _add_bomb_to_zone(tile_position: Position, new_zone: u64) -> u64 {
    let index = storage.zones.get(new_zone).len();
    storage.zones.get(new_zone).push(Link::Tile(tile_position));
    index
}

// TODO for bomb
// #[storage(read, write)]
// fn _remove_player_from_zone(old_zone: u64, old_index: u64) {
//     let length = storage.zones.get(old_zone).len();
//     if old_index == length -1 {
//         let _ = storage.zones.get(old_zone).pop();
//     } else {
//         let account_at_the_end = storage.zones.get(old_zone).pop().unwrap();
//         let mut player_at_the_end = storage.players.get(account_at_the_end).try_read().unwrap();
//         player_at_the_end.zone_list_index = old_index;
//         storage.players.insert(account_at_the_end, player_at_the_end);
//         storage.zones.get(old_zone).set(old_index, account_at_the_end);    
//     }
// }


#[storage(read)]
fn _update_player_for_explosion(player: PlayerInStorage, time: u64) -> PlayerInStorage {
    let mut updated_player = PlayerInStorage {
        position: player.position,
        time: player.time,
        zone_list_index: player.zone_list_index,
        life: player.life,
        next_bomb: player.next_bomb
    };
    match _get_tile(player.position) {
        Option::Some(tile) => {
            if tile.explosion_start < time && tile.explosion_end > player.time {
                updated_player.life = player.life -1
            }
        },
        Option::None => {},
    }
    updated_player
}
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// ABI IMPLEMENTATION
// ----------------------------------------------------------------------------
impl Game for Contract {
    // ------------------------------------------------------------------------
    // TODO remove, used for testing only
    // ------------------------------------------------------------------------
    fn identity() -> Identity {
        msg_sender().unwrap()
    }

    fn calculate_zone(position: Position) -> u64 {
        _calculate_zone(position)
    }
    // ------------------------------------------------------------------------

    // ------------------------------------------------------------------------
    // TODO ADMIN / DEBUGGING
    // ------------------------------------------------------------------------
    #[storage(write, read)]
    fn increase_time(seconds: u64) {
        let mut time_delta = storage.time_delta.try_read().unwrap_or(0);
        time_delta += seconds;
        storage.time_delta.write(time_delta);
    }
    #[storage(read)]
    fn get_time() -> u64 {
        _time()
    }
    // ------------------------------------------------------------------------

    #[storage(write, read)]
    fn enter() {
        let account = msg_sender().unwrap();
        let time = _time();

        match _get_player(account) {
            Option::Some(_) => panic GameError::PlayerAlreadyIn,
            Option::None => {
                let entrance_position = ENTRANCE;
                let entrance_zone = _calculate_zone(entrance_position);
                let zone_list_index = _add_player_to_zone(account, entrance_zone);
                let player = PlayerInStorage {
                    position: entrance_position,
                    time: time,
                    zone_list_index: zone_list_index,
                    next_bomb: 0,
                    life: 1
                };
                storage.players.insert(account, player);
                // TODO Event
            }
        }
        
    }

    #[storage(write, read)]
    fn move(new_position: Position, i: u64) {
        let account = msg_sender().unwrap();
        let time = _time();

        match _get_player(account) {
            Option::Some(player) => {

               
                if player.life  == 0 {
                    panic GameError::PlayerIsDead;
                }

                if player.time >= time {
                    // we do not error, we just return early
                    // panic GameError::PlayerAlreadyMoved;
                    return;
                }

                
                match _get_tile(new_position) {
                    Option::Some(tile) => {
                        if tile.is_bomb_tile && tile.explosion_end > time {
                            panic GameError::BombAlreadyThere
                        } else {

                        }
                    },
                    Option::None => {},
                }

                let old_zone = _calculate_zone(player.position);
                let new_zone = _calculate_zone(new_position);

                let mut zone_list_index = player.zone_list_index;
                if old_zone != new_zone {
                    _remove_player_from_zone(old_zone, zone_list_index);
                    zone_list_index = _add_player_to_zone(account, new_zone);
                }
                
                // Update player in storage
                // TODO: we recreate a copy as we could not get a mut ref from Option::Some(player)
                storage.players.insert(account, PlayerInStorage {
                    position: new_position,
                    time: time,
                    zone_list_index: zone_list_index,
                    life: player.life,
                    next_bomb: player.next_bomb
                });

                // TODO Event

            },
            Option::None => panic GameError::PlayerNotIn,
        }
    }


     #[storage(write, read)]
    fn place_bomb() {
        let account = msg_sender().unwrap();
        let time = _time();
        match _get_player(account) {
            Option::Some(player) => {

                if player.life  == 0 {
                    panic GameError::PlayerIsDead;
                }

                match _get_tile(player.position) {
                    Option::Some(tile) => {
                        if tile.is_bomb_tile && tile.explosion_end > time {
                            panic GameError::BombAlreadyThere
                        } else {

                        }
                    },
                    Option::None => {

                    },
                }


                _add_bomb_to_zone(player.position, _calculate_zone(player.position));
                let explosion_start = time + 10; 
                let explosion_end = explosion_start + 3;
                storage.tiles.insert(
                    player.position,
                    TileInStorage {
                        is_bomb_tile: true,
                        explosion_start:explosion_start,
                        explosion_end:explosion_end
                    }
                );
                let mut down_counter = 0;
                while (down_counter < 4) {
                    storage.tiles.insert(
                        Position {
                            x: player.position.x,
                            y: player.position.y + down_counter,
                        },
                        TileInStorage {
                            is_bomb_tile: false, 
                            explosion_start:explosion_start,
                            explosion_end:explosion_end
                        }
                    );
                    down_counter  = down_counter + 1;
                }
                let mut up_counter = 0;
                while (up_counter < 4) {
                    storage.tiles.insert(
                        Position {
                            x: player.position.x,
                            y: player.position.y - up_counter,
                        },
                        TileInStorage {
                            is_bomb_tile: false, 
                            explosion_start:explosion_start,
                            explosion_end:explosion_end
                        }
                    );
                    up_counter  = up_counter + 1;
                }
                let mut left_counter = 0;
                while (left_counter < 4) {
                    storage.tiles.insert(
                        Position {
                            x: player.position.x - left_counter,
                            y: player.position.y,
                        },
                        TileInStorage {
                            is_bomb_tile: false, 
                            explosion_start:explosion_start,
                            explosion_end:explosion_end
                        }
                    );
                    left_counter  = left_counter + 1;
                }
                let mut righ_counter = 0;
                while (righ_counter < 4) {
                    storage.tiles.insert(
                        Position {
                            x: player.position.x + righ_counter,
                            y: player.position.y,
                        },
                        TileInStorage {
                            is_bomb_tile: false, 
                            explosion_start:explosion_start,
                            explosion_end:explosion_end
                        }
                    );
                    righ_counter  = righ_counter + 1;
                }
            },
            Option::None => panic GameError::PlayerNotIn,
        }
    }

    #[storage(read)]
    fn position(account: Identity) -> Option<Position> {
        match _get_player(account) {
            Option::Some(player) => Option::Some(player.position),
            Option::None => Option::None,
        }
    }

    #[storage(read)]
    fn get_zones(zones: Vec<u64>) -> ZonesInfo {
        let time = _time();
        let mut list_of_entity_list: Vec<Vec<Entity>> = Vec::new();
        for zone in zones.iter() {
            let mut list_of_entities: Vec<Entity> = Vec::new();
            let zone_entity_list = storage.zones.get(zone);
            let length = zone_entity_list.len();
            let mut counter = 0;
            while counter < length {
                let link = zone_entity_list.get(counter).unwrap().try_read().unwrap();
                match link {
                    Link::Player(account) => {
                        let player = _get_player(account).unwrap();
                        list_of_entities.push(Entity::Player(Player {
                            account: account,
                            position: player.position,
                            life: player.life,
                            time: player.time,
                            next_bomb: player.next_bomb
                        }));
                    },
                    Link::Tile(tile_position) => {
                        let tile = _get_tile(tile_position).unwrap();
                        list_of_entities.push(Entity::Bomb(Bomb {
                            position: tile_position,
                            length: 0, // TODO no effect for now
                            start: tile.explosion_start,
                            end: tile.explosion_end,
                        }));
                    }
                }
                
                counter = counter + 1
            }
            list_of_entity_list.push(list_of_entities);
        }
        ZonesInfo {
            time: time,
            zones: list_of_entity_list,
        }
    }
}
// ----------------------------------------------------------------------------


// ----------------------------------------------------------------------------
// TESTS
// ----------------------------------------------------------------------------
#[test]
fn can_move() {
    let caller = abi(Game, CONTRACT_ID);
    let account = caller.identity();
    caller.enter();
    let new_position = Position {x: 1, y: 1};
    caller.move(new_position, 0);
    let current_position = caller.position(account);
    assert_eq(current_position, Some(new_position));
}

#[test]
fn can_get_player_in_zone_after_entering() {
    let caller = abi(Game, CONTRACT_ID);
    let account = caller.identity();
    caller.enter();
    let mut zones: Vec<u64> = Vec::new();
    zones.push(_calculate_zone(ENTRANCE));
    let list_of_player_list = caller.get_zones(zones).zones;
    
    match list_of_player_list.get(0).unwrap().get(0).unwrap() {
        Entity::Player(player) => assert_eq(player.account, account),
        Entity::Bomb(bomb) => assert_eq(false, true),
    }
    
}

#[test]
fn can_get_player_in_zone_after_moving() {
    let caller = abi(Game, CONTRACT_ID);
    let account = caller.identity();
    caller.enter();
    caller.move(Position {x: ENTRANCE.x, y: ENTRANCE.y - 1}, 0);

    let mut zones: Vec<u64> = Vec::new();
    zones.push(_calculate_zone(ENTRANCE));
    let list_of_player_list = caller.get_zones(zones).zones;
    
    match list_of_player_list.get(0).unwrap().get(0).unwrap() {
        Entity::Player(player) => assert_eq(player.account, account),
        Entity::Bomb(bomb) => assert_eq(false, true),
    }
}
// ----------------------------------------------------------------------------
