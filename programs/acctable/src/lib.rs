use anchor_lang::prelude::*;

declare_id!("9U2SnYkHeWhQHsteHZBGb2W776MrahyWXTuvZhQoQwbi");

#[program]
pub mod acctable {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
