use anchor_lang::prelude::*;
pub mod errors;
pub mod instructions;
pub mod state;

pub use instructions::*;
pub use crate::state::LockState;

declare_id!("9U2SnYkHeWhQHsteHZBGb2W776MrahyWXTuvZhQoQwbi");

#[program]
pub mod acctable {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn lock(ctx: Context<Lock>, amt: u64) -> Result<()> {
        instructions::lock::lock_handler(ctx, amt)?;
        Ok(())
    }

    pub fn unlock(ctx: Context<Unlock>) -> Result<()> {
        instructions::unlock::unlock_handler(ctx)?;
        Ok(())
    }

    pub fn mark_complete(ctx: Context<MarkComplete>) -> Result<()> {
        instructions::mark_complete::mark_handler(ctx)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
