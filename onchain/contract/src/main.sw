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
    fn move(new_position: Position);

    #[storage(read)]
    fn position(identity: Identity) -> u64;
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
struct Player {
    position: Position,
    life: u64
}

struct Zone {
    players: StorageVec<Identity>
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
    players: StorageMap<Identity, Player> = StorageMap {},
    zones: StorageMap<u64, Zone> = StorageMap {},
}
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// CONSTANTS AND CONFIGURABLES
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// INTERNAL FUNCTIONS
// ----------------------------------------------------------------------------
#[storage(read)]
fn _time() -> u64 {
    const TAI_64_CONVERTER: u64 = 10 + (1 << 62);
    Time::now().as_tai64() - TAI_64_CONVERTER  + storage.time_delta.try_read().unwrap_or(0)
}

fn _calculate_zone_index(position: Position) -> u64 {
    // Define zone size (how many position units per zone)
    // Using power of 2 for efficient division
    let zone_size: u64 = 64;
    
    // Divide coordinates by zone size to get zone coordinates
    let x_zone: u64 = position.x / zone_size;
    let y_zone: u64 = position.y / zone_size;
    
    // Calculate a unique zone index using bit manipulation
    // This creates a unique number for each (x,y) zone coordinate pair
    // Using 32 bits for each coordinate (more than enough for game zones)
    // Zone index = (y_zone << 32) | x_zone
    (y_zone << 32) | x_zone
}

#[storage(read)]
fn _get_player(account: Identity) -> Player {
    storage.players.get(account).try_read().unwrap_or(Player {
        position: Position {x: 1 << 63, y: 1 << 63}, // Start at the middle of u64 range
        life: 100
    })
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
    fn move(new_position: Position) {
        let account = msg_sender().unwrap();
        let mut player = _get_player(account);

        // TODO check if movement is possible

        let old_zone_index = _calculate_zone_index(player.position);
        let new_zone_index = _calculate_zone_index(new_position);


        player.position = new_position;
        if old_zone_index != new_zone_index {
            // TODO: Update zone membership (remove from old zone, add to new zone)
        }
        
        // Update player in storage
        storage.players.insert(account, player);

        // TODO Event
    }

    #[storage(read)]
    fn position(identity: Identity) -> u64 {
        0
    }
}
// ----------------------------------------------------------------------------


// ----------------------------------------------------------------------------
// TESTS
// ----------------------------------------------------------------------------
#[test]
fn can_move() {
   
}
// ----------------------------------------------------------------------------
