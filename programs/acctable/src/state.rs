use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct LockState {
    pub amt: u64,
    pub is_completed: bool,
}