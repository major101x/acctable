use crate::errors::AcctableError;
use crate::state::LockState;
use anchor_lang::prelude::*;

pub fn unlock_handler(_ctx: Context<Unlock>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct Unlock<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut, close = payer, constraint = lock.is_completed @ AcctableError::TasksNotCompleted, seeds = [b"lock", payer.key().as_ref()], bump)]
    pub lock: Account<'info, LockState>,

    pub system_program: Program<'info, System>,
}
