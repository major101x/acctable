use crate::state::LockState;
use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

pub fn lock(ctx: Context<Lock>, amt: u64) -> Result<()> {
    let payer = &ctx.accounts.payer;
    let lock = &mut ctx.accounts.lock;
    let program_id = &ctx.accounts.system_program;
    let fee_receiver = &ctx.accounts.fee_receiver;

    let fee = amt
        .checked_mul(3)
        .ok_or(ProgramError::ArithmeticOverflow)?
        .checked_div(100)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    let amount = amt
        .checked_sub(fee)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    let cpi_context = CpiContext::new(
        program_id.to_account_info(),
        Transfer {
            from: payer.to_account_info(),
            to: lock.to_account_info(),
        },
    );

    transfer(cpi_context, amount)?;

    let cpi_context = CpiContext::new(
        program_id.to_account_info(),
        Transfer {
            from: payer.to_account_info(),
            to: fee_receiver.to_account_info(),
        },
    );

    transfer(cpi_context, fee)?;

    lock.amt = amount;
    lock.is_completed = false;

    Ok(())
}

#[derive(Accounts)]
pub struct Lock<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(init, payer = payer, space = 8 + LockState::INIT_SPACE, seeds = [b"lock", payer.key().as_ref()], bump)]
    pub lock: Account<'info, LockState>,

    pub system_program: Program<'info, System>,

    #[account(mut)]
    pub fee_receiver: SystemAccount<'info>,
}
