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
    life: u64
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

    #[storage(write, read)]
    fn increase_time(seconds: u64);

    #[storage(read)]
    fn get_time() -> u64;
    // ------------------------------------------------------------------------
    #[storage(write, read)]
    fn enter();

    #[storage(write, read)]
    fn move(new_position: Position);

    #[storage(read)]
    fn position(identity: Identity) -> Option<Position>;

    #[storage(read)]
    fn players_in_zones(zones: Vec<u64>) -> Vec<Vec<Player>>;
}
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// STORAGE TYPES
// ----------------------------------------------------------------------------

struct Position {
    x: u64,
    y: u64
}

impl PartialEq for Position {
    fn eq(self, other: Self) -> bool {
        self.x == other.x && self.y == other.y
    }
}
struct PlayerInStorage {
    position: Position,
    zone_list_index: u64,
    life: u64
}

// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// STORAGE
// ----------------------------------------------------------------------------
storage {
    // ------------------------------------------------------------------------
    // TODO remove, used for testing only
    // ------------------------------------------------------------------------
    time_delta: u64 = 0,
    // ------------------------------------------------------------------------
    players: StorageMap<Identity, PlayerInStorage> = StorageMap {},
    zones: StorageMap<u64, StorageVec<Identity>> = StorageMap {},
}
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// CONSTANTS AND CONFIGURABLES
// ----------------------------------------------------------------------------
const ENTRANCE = Position {x: 1 << 31, y: 1 << 31}; // Start somwhere high enough
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
    storage.players.get(account).try_read()
}

#[storage(read, write)]
fn _add_player_to_zone(account: Identity, new_zone: u64) -> u64 {
    let index = storage.zones.get(new_zone).len();
    storage.zones.get(new_zone).push(account);
    index
}
#[storage(read, write)]
fn _remove_player_from_zone(old_zone: u64, old_index: u64) {
    let length = storage.zones.get(old_zone).len();
    if old_index == length -1 {
        let _ = storage.zones.get(old_zone).pop();
    } else {
        let account_at_the_end = storage.zones.get(old_zone).pop().unwrap();
        let mut player_at_the_end = storage.players.get(account_at_the_end).try_read().unwrap();
        player_at_the_end.zone_list_index = old_index;
        storage.players.insert(account_at_the_end, player_at_the_end);
        storage.zones.get(old_zone).insert(old_index, account_at_the_end);    
    }
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

        match _get_player(account) {
            Option::Some(_) => panic GameError::PlayerAlreadyIn,
            Option::None => {
                let entrance_position = ENTRANCE;
                let entrance_zone = _calculate_zone(entrance_position);
                let zone_list_index = _add_player_to_zone(account, entrance_zone);
                let player = PlayerInStorage {
                    position: entrance_position,
                    zone_list_index: zone_list_index,
                    life: 100
                };
                storage.players.insert(account, player);
                // TODO Event
            }
        }
        
    }

    #[storage(write, read)]
    fn move(new_position: Position) {
        let account = msg_sender().unwrap();

        match _get_player(account) {
            Option::Some(player) => {
                // TODO check if movement is possible

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
                    zone_list_index: zone_list_index,
                    life: player.life
                });

                // TODO Event

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
    fn players_in_zones(zones: Vec<u64>) -> Vec<Vec<Player>> {
        let mut list_of_player_list: Vec<Vec<Player>> = Vec::new();
        for zone in zones.iter() {
            let mut list_of_players: Vec<Player> = Vec::new();
            let zone_player_list = storage.zones.get(zone);
            let length = zone_player_list.len();
            let mut counter = 0;
            while counter < length {
                let account = zone_player_list.get(counter).unwrap().try_read().unwrap();
                let player = _get_player(account).unwrap();
                list_of_players.push(Player {
                    account: account,
                    position: player.position,
                    life: player.life
                });
                counter = counter + 1
            }
            list_of_player_list.push(list_of_players);
        }
        list_of_player_list
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
    caller.move(new_position);
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
    let list_of_player_list = caller.players_in_zones(zones);
    
    let player = list_of_player_list.get(0).unwrap().get(0).unwrap();
    assert_eq(player.account, account);
}
// ----------------------------------------------------------------------------
