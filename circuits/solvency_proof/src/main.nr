// Prism Protocol - Solvency Proof Circuit
// Proves that a user's balance meets a threshold WITHOUT revealing the actual balance
// Used for dark pool trading - prove you have enough funds to participate

/// Main solvency proof function
/// 
/// Private inputs (hidden from verifier):
/// - actual_balance: The user's real balance (e.g., 500,000 SOL)
///
/// Public inputs (visible to verifier):
/// - threshold: The minimum balance required (e.g., 10,000 SOL)
///
/// Returns: true if actual_balance >= threshold
fn main(
    actual_balance: u64,    // Private: User's real balance
    threshold: pub u64       // Public: Minimum required
) -> pub bool {
    // Simple comparison - balance must be >= threshold
    let is_solvent = actual_balance >= threshold;
    
    // Assert the condition (proof will fail if false)
    assert(is_solvent, "Balance does not meet threshold");
    
    is_solvent
}

/// Test the circuit with sample values
#[test]
fn test_solvency_pass() {
    // User has 500,000, threshold is 10,000 - should pass
    let result = main(500000, 10000);
    assert(result == true);
}

#[test]
fn test_solvency_exact() {
    // User has exactly the threshold - should pass
    let result = main(10000, 10000);
    assert(result == true);
}

#[test(should_fail)]
fn test_solvency_fail() {
    // User has 5,000, threshold is 10,000 - should fail
    let _result = main(5000, 10000);
}

#[test]
fn test_large_balance() {
    // Whale with 10M balance, threshold 100K
    let result = main(10000000, 100000);
    assert(result == true);
}
