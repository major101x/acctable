use anchor_lang::prelude::*;

#[error_code]
pub enum AcctableError {
    #[msg("The tasks to unlock this wallet has not been completed!")]
    TasksNotCompleted
}