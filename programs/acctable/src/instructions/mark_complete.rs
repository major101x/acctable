use anchor_lang::prelude::*;
use crate::LockState;

pub fn mark_handler(ctx: Context<MarkComplete>) -> Result<()> {
    ctx.accounts.lock.is_completed = true;
    Ok(())
}

#[derive(Accounts)]
pub struct MarkComplete<'info> {
    pub payer: Signer<'info>,

    #[account(mut, seeds = [b"lock", payer.key().as_ref()], bump)]
    pub lock: Account<'info, LockState>,
}