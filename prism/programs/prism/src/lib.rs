use anchor_lang::prelude::*;

declare_id!("DkD3vtS6K8dJFnGmm9X9CphNDU5LYTYyP8Ve5EEVENdu");

#[program]
pub mod prism {
    use super::*;

    /// Create a root identity for a user (one per wallet)
    /// This is the master identity that owns all contexts
    pub fn create_root_identity(
        ctx: Context<CreateRootIdentity>,
        privacy_level: u8,
    ) -> Result<()> {
        require!(privacy_level <= 4, PrismError::InvalidPrivacyLevel);
        
        let root = &mut ctx.accounts.root_identity;
        root.owner = ctx.accounts.user.key();
        root.created_at = Clock::get()?.unix_timestamp;
        root.privacy_level = privacy_level;
        root.context_count = 0;
        root.bump = ctx.bumps.root_identity;
        
        emit!(RootIdentityCreated {
            owner: root.owner,
            privacy_level,
            timestamp: root.created_at,
        });
        
        Ok(())
    }

    /// Create a new context (disposable identity) linked to root
    /// Used for dark pool trading, DeFi, etc.
    pub fn create_context(
        ctx: Context<CreateContext>,
        context_type: u8,
        max_per_transaction: u64,
    ) -> Result<()> {
        require!(context_type <= 5, PrismError::InvalidContextType);
        
        let context = &mut ctx.accounts.context_identity;
        let root = &mut ctx.accounts.root_identity;
        
        context.root_identity = root.key();
        context.context_type = context_type;
        context.created_at = Clock::get()?.unix_timestamp;
        context.max_per_transaction = max_per_transaction;
        context.total_spent = 0;
        context.revoked = false;
        context.context_index = root.context_count;
        context.bump = ctx.bumps.context_identity;
        
        root.context_count = root.context_count.checked_add(1).unwrap();
        
        emit!(ContextCreated {
            root_identity: root.key(),
            context_identity: context.key(),
            context_type,
            max_per_transaction,
            context_index: context.context_index,
            timestamp: context.created_at,
        });
        
        Ok(())
    }

    /// Revoke a context (burn disposable identity after use)
    /// Used after dark pool trade to eliminate trace
    pub fn revoke_context(ctx: Context<RevokeContext>) -> Result<()> {
        let context = &mut ctx.accounts.context_identity;
        
        require!(!context.revoked, PrismError::ContextAlreadyRevoked);
        
        context.revoked = true;
        
        emit!(ContextRevoked {
            root_identity: context.root_identity,
            context_identity: context.key(),
            context_type: context.context_type,
            total_spent: context.total_spent,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    /// Check if a transaction amount is within context spending limits
    /// Called before executing trades in dark pools
    pub fn check_spending_limit(
        ctx: Context<CheckSpendingLimit>,
        amount: u64,
    ) -> Result<()> {
        let context = &ctx.accounts.context_identity;
        
        require!(!context.revoked, PrismError::ContextRevoked);
        require!(
            amount <= context.max_per_transaction,
            PrismError::ExceedsTransactionLimit
        );
        
        Ok(())
    }

    /// Record spending against a context (for tracking limits)
    pub fn record_spending(
        ctx: Context<RecordSpending>,
        amount: u64,
    ) -> Result<()> {
        let context = &mut ctx.accounts.context_identity;
        
        require!(!context.revoked, PrismError::ContextRevoked);
        require!(
            amount <= context.max_per_transaction,
            PrismError::ExceedsTransactionLimit
        );
        
        context.total_spent = context.total_spent.checked_add(amount)
            .ok_or(PrismError::SpendingOverflow)?;
        
        emit!(SpendingRecorded {
            context_identity: context.key(),
            amount,
            total_spent: context.total_spent,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    /// Update privacy level for root identity
    pub fn update_privacy_level(
        ctx: Context<UpdatePrivacyLevel>,
        new_privacy_level: u8,
    ) -> Result<()> {
        require!(new_privacy_level <= 4, PrismError::InvalidPrivacyLevel);
        
        let root = &mut ctx.accounts.root_identity;
        let old_level = root.privacy_level;
        root.privacy_level = new_privacy_level;
        
        emit!(PrivacyLevelUpdated {
            root_identity: root.key(),
            old_level,
            new_level: new_privacy_level,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
}

// ============================================================================
// ACCOUNT CONTEXTS
// ============================================================================

#[derive(Accounts)]
pub struct CreateRootIdentity<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        init,
        payer = user,
        space = RootIdentity::SIZE,
        seeds = [b"root", user.key().as_ref()],
        bump
    )]
    pub root_identity: Account<'info, RootIdentity>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateContext<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"root", user.key().as_ref()],
        bump = root_identity.bump,
        constraint = root_identity.owner == user.key() @ PrismError::Unauthorized
    )]
    pub root_identity: Account<'info, RootIdentity>,
    
    #[account(
        init,
        payer = user,
        space = ContextIdentity::SIZE,
        seeds = [
            b"context",
            root_identity.key().as_ref(),
            &root_identity.context_count.to_le_bytes()
        ],
        bump
    )]
    pub context_identity: Account<'info, ContextIdentity>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeContext<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        seeds = [b"root", user.key().as_ref()],
        bump = root_identity.bump,
        constraint = root_identity.owner == user.key() @ PrismError::Unauthorized
    )]
    pub root_identity: Account<'info, RootIdentity>,
    
    #[account(
        mut,
        seeds = [
            b"context",
            root_identity.key().as_ref(),
            &context_identity.context_index.to_le_bytes()
        ],
        bump = context_identity.bump,
        constraint = context_identity.root_identity == root_identity.key() @ PrismError::ContextMismatch
    )]
    pub context_identity: Account<'info, ContextIdentity>,
}

#[derive(Accounts)]
pub struct CheckSpendingLimit<'info> {
    #[account(
        seeds = [
            b"context",
            context_identity.root_identity.as_ref(),
            &context_identity.context_index.to_le_bytes()
        ],
        bump = context_identity.bump
    )]
    pub context_identity: Account<'info, ContextIdentity>,
}

#[derive(Accounts)]
pub struct RecordSpending<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        seeds = [b"root", user.key().as_ref()],
        bump = root_identity.bump,
        constraint = root_identity.owner == user.key() @ PrismError::Unauthorized
    )]
    pub root_identity: Account<'info, RootIdentity>,
    
    #[account(
        mut,
        seeds = [
            b"context",
            root_identity.key().as_ref(),
            &context_identity.context_index.to_le_bytes()
        ],
        bump = context_identity.bump,
        constraint = context_identity.root_identity == root_identity.key() @ PrismError::ContextMismatch
    )]
    pub context_identity: Account<'info, ContextIdentity>,
}

#[derive(Accounts)]
pub struct UpdatePrivacyLevel<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"root", user.key().as_ref()],
        bump = root_identity.bump,
        constraint = root_identity.owner == user.key() @ PrismError::Unauthorized
    )]
    pub root_identity: Account<'info, RootIdentity>,
}

// ============================================================================
// ACCOUNT STRUCTS
// ============================================================================

#[account]
pub struct RootIdentity {
    pub owner: Pubkey,           // 32 bytes - wallet that owns this identity
    pub created_at: i64,         // 8 bytes  - unix timestamp
    pub privacy_level: u8,       // 1 byte   - 0=Maximum, 1=High, 2=Medium, 3=Low, 4=Public
    pub context_count: u16,      // 2 bytes  - number of contexts created
    pub bump: u8,                // 1 byte   - PDA bump seed
}

impl RootIdentity {
    pub const SIZE: usize = 8 + 32 + 8 + 1 + 2 + 1; // 52 bytes
}

#[account]
pub struct ContextIdentity {
    pub root_identity: Pubkey,       // 32 bytes - parent root identity
    pub context_type: u8,            // 1 byte   - 0=DeFi, 1=Social, 2=Gaming, 3=Professional, 4=Temporary, 5=Public
    pub created_at: i64,             // 8 bytes  - unix timestamp
    pub max_per_transaction: u64,    // 8 bytes  - spending limit per tx (lamports)
    pub total_spent: u64,            // 8 bytes  - total spent through this context
    pub revoked: bool,               // 1 byte   - whether context is burned
    pub context_index: u16,          // 2 bytes  - index for PDA derivation
    pub bump: u8,                    // 1 byte   - PDA bump seed
}

impl ContextIdentity {
    pub const SIZE: usize = 8 + 32 + 1 + 8 + 8 + 8 + 1 + 2 + 1; // 69 bytes
}

// ============================================================================
// CONTEXT TYPES (for reference)
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ContextType {
    DeFi = 0,        // Dark pool trading, swaps
    Social = 1,      // Social interactions
    Gaming = 2,      // Gaming activities  
    Professional = 3, // Work-related
    Temporary = 4,   // Auto-burn after use
    Public = 5,      // Flex mode - fully public
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum PrivacyLevel {
    Maximum = 0,     // Full anonymity
    High = 1,        // Minimal disclosure
    Medium = 2,      // Balanced
    Low = 3,         // More transparent
    Public = 4,      // Fully public
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct RootIdentityCreated {
    pub owner: Pubkey,
    pub privacy_level: u8,
    pub timestamp: i64,
}

#[event]
pub struct ContextCreated {
    pub root_identity: Pubkey,
    pub context_identity: Pubkey,
    pub context_type: u8,
    pub max_per_transaction: u64,
    pub context_index: u16,
    pub timestamp: i64,
}

#[event]
pub struct ContextRevoked {
    pub root_identity: Pubkey,
    pub context_identity: Pubkey,
    pub context_type: u8,
    pub total_spent: u64,
    pub timestamp: i64,
}

#[event]
pub struct SpendingRecorded {
    pub context_identity: Pubkey,
    pub amount: u64,
    pub total_spent: u64,
    pub timestamp: i64,
}

#[event]
pub struct PrivacyLevelUpdated {
    pub root_identity: Pubkey,
    pub old_level: u8,
    pub new_level: u8,
    pub timestamp: i64,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum PrismError {
    #[msg("Unauthorized: You don't own this identity")]
    Unauthorized,
    
    #[msg("Context mismatch: Context doesn't belong to this root")]
    ContextMismatch,
    
    #[msg("Context already revoked")]
    ContextAlreadyRevoked,
    
    #[msg("Context is revoked and cannot be used")]
    ContextRevoked,
    
    #[msg("Amount exceeds transaction limit for this context")]
    ExceedsTransactionLimit,
    
    #[msg("Spending overflow: Total spent would exceed u64 max")]
    SpendingOverflow,
    
    #[msg("Invalid privacy level: Must be 0-4")]
    InvalidPrivacyLevel,
    
    #[msg("Invalid context type: Must be 0-5")]
    InvalidContextType,
}
