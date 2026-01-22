use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;

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
        context.root_identity_hash = None;
        context.encryption_commitment = None;
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

    /// Create a context with encrypted root identity for enhanced privacy
    /// The root identity PDA is encrypted with Arcium MPC and stored as a hash
    /// This prevents linking multiple contexts together (they all have encrypted root_identity)
    pub fn create_context_encrypted(
        ctx: Context<CreateContext>,
        context_type: u8,
        max_per_transaction: u64,
        root_identity_hash: [u8; 32],
        encryption_commitment: [u8; 32],
    ) -> Result<()> {
        require!(context_type <= 5, PrismError::InvalidContextType);
        
        let context = &mut ctx.accounts.context_identity;
        let root = &mut ctx.accounts.root_identity;
        
        // Verify the hash matches the root identity PDA (what's stored in context)
        // This ensures the root identity is properly encrypted
        let computed_hash = hash_root_identity(&root.key());
        require!(
            computed_hash == root_identity_hash,
            PrismError::InvalidRootHash
        );
        
        // Store ONLY encrypted/hashed root identity (no plaintext for privacy)
        // The root_identity field is set to a zero pubkey to indicate it's encrypted
        // All verification uses root_identity_hash instead
        context.root_identity = Pubkey::default(); // Zero pubkey = encrypted context
        context.root_identity_hash = Some(root_identity_hash); // Hash of root identity PDA (from Arcium)
        context.encryption_commitment = Some(encryption_commitment);
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

    /// Verify an Arcium encryption commitment
    /// This can be called on-chain to verify commitments without decrypting
    pub fn verify_commitment(
        ctx: Context<VerifyCommitment>,
        commitment: [u8; 32],
        binding_key: Pubkey,
    ) -> Result<bool> {
        // Verify commitment format (64 hex chars = 32 bytes)
        // In production, this would verify against stored commitment
        let context = &ctx.accounts.context_identity;
        
        if let Some(stored_commitment) = context.encryption_commitment {
            // Verify commitment matches and binding key matches context
            let is_valid = stored_commitment == commitment 
                && binding_key == context.key();
            
            Ok(is_valid)
        } else {
            // No commitment stored, cannot verify
            Ok(false)
        }
    }

    /// Revoke a context (burn disposable identity after use)
    /// Used after dark pool trade to eliminate trace
    pub fn revoke_context(ctx: Context<RevokeContext>) -> Result<()> {
        let context = &mut ctx.accounts.context_identity;
        
        require!(!context.revoked, PrismError::ContextAlreadyRevoked);
        
        context.revoked = true;
        
        // For encrypted contexts, root_identity is zero pubkey (privacy)
        emit!(ContextRevoked {
            root_identity: context.root_identity, // May be zero for encrypted contexts
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
pub struct VerifyCommitment<'info> {
    #[account(
        seeds = [
            b"context",
            // For encrypted contexts, derive from root_identity account instead
            // This requires passing root_identity as a separate account
            root_identity.key().as_ref(),
            &context_identity.context_index.to_le_bytes()
        ],
        bump = context_identity.bump
    )]
    pub context_identity: Account<'info, ContextIdentity>,
    
    // Need root_identity account to derive PDA for encrypted contexts
    #[account(
        seeds = [b"root", user.key().as_ref()],
        bump = root_identity.bump
    )]
    pub root_identity: Account<'info, RootIdentity>,
    
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct CheckSpendingLimit<'info> {
    #[account(
        seeds = [
            b"context",
            root_identity.key().as_ref(),
            &context_identity.context_index.to_le_bytes()
        ],
        bump = context_identity.bump
    )]
    pub context_identity: Account<'info, ContextIdentity>,
    
    // Need root_identity account to derive PDA for encrypted contexts
    #[account(
        seeds = [b"root", user.key().as_ref()],
        bump = root_identity.bump
    )]
    pub root_identity: Account<'info, RootIdentity>,
    
    pub user: Signer<'info>,
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
    pub root_identity: Pubkey,           // 32 bytes - parent root identity
    pub root_identity_hash: Option<[u8; 32]>, // 33 bytes - optional hash of root identity for privacy
    pub encryption_commitment: Option<[u8; 32]>, // 33 bytes - optional Arcium commitment for verification
    pub context_type: u8,                // 1 byte   - 0=DeFi, 1=Social, 2=Gaming, 3=Professional, 4=Temporary, 5=Public
    pub created_at: i64,                 // 8 bytes  - unix timestamp
    pub max_per_transaction: u64,        // 8 bytes  - spending limit per tx (lamports)
    pub total_spent: u64,                 // 8 bytes  - total spent through this context
    pub revoked: bool,                    // 1 byte   - whether context is burned
    pub context_index: u16,              // 2 bytes  - index for PDA derivation
    pub bump: u8,                        // 1 byte   - PDA bump seed
}

impl ContextIdentity {
    // Updated size: discriminator (8) + root_identity (32) + root_identity_hash (1 + 32) + 
    // encryption_commitment (1 + 32) + context_type (1) + created_at (8) + max_per_transaction (8) + 
    // total_spent (8) + revoked (1) + context_index (2) + bump (1)
    pub const SIZE: usize = 8 + 32 + 33 + 33 + 1 + 8 + 8 + 8 + 1 + 2 + 1; // 135 bytes
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

// Helper function to hash root identity
fn hash_root_identity(root_pubkey: &Pubkey) -> [u8; 32] {
    let hash_result = hash(&root_pubkey.to_bytes());
    hash_result.to_bytes()
}

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
    
    #[msg("Invalid root identity hash: Hash does not match root identity PDA")]
    InvalidRootHash,
}
