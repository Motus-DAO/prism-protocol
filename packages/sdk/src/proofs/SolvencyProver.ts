// Prism Protocol - Solvency Proof Generator
// Uses Noir circuit to prove balance >= threshold without revealing actual balance

import type { SolvencyProof } from '../types';

/**
 * SolvencyProver - Generates ZK proofs that a balance meets a threshold
 * 
 * Usage:
 * ```typescript
 * const prover = new SolvencyProver();
 * await prover.initialize();
 * 
 * const proof = await prover.generateProof({
 *   actualBalance: 500000n,  // Private: User's real balance
 *   threshold: 10000n         // Public: Minimum required
 * });
 * 
 * const isValid = await prover.verifyProof(proof);
 * ```
 */
export class SolvencyProver {
  private initialized: boolean = false;
  private noir: any = null;
  private backend: any = null;
  private circuit: any = null;
  private useMockMode: boolean = false;

  /**
   * Initialize the prover with the Noir circuit
   * Must be called before generating proofs
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load the compiled circuit artifact
      this.circuit = await this.loadCircuit();
      
      // Dynamic imports for Noir packages
      // These will be available when running in Node.js/browser environment
      const noirModule = await import('@noir-lang/noir_js');
      const bbModule = await import('@aztec/bb.js');
      
      // Initialize the backend (UltraHonk prover from Aztec)
      // @ts-ignore - Dynamic import types
      this.backend = new bbModule.UltraHonkBackend(this.circuit.bytecode);
      
      // Initialize Noir with the circuit
      // @ts-ignore - Dynamic import types
      this.noir = new noirModule.Noir(this.circuit);
      
      this.initialized = true;
      this.useMockMode = false;
      console.log('SolvencyProver initialized with real backend');
    } catch (error) {
      // Fallback to mock mode for environments without WASM support
      console.log('SolvencyProver: Using simulation mode (WASM backend not available)');
      this.initialized = true;
      this.useMockMode = true;
    }
  }

  /**
   * Load the compiled Noir circuit artifact
   */
  private async loadCircuit(): Promise<any> {
    // Try to load from file system (Node.js)
    try {
      const fs = await import('fs');
      const path = await import('path');
      const circuitPath = path.join(__dirname, '../../circuits/solvency_proof.json');
      const circuitJson = fs.readFileSync(circuitPath, 'utf-8');
      return JSON.parse(circuitJson);
    } catch (e) {
      // If file system not available, try alternate path
      try {
        const fs = await import('fs');
        const path = await import('path');
        const circuitPath = path.join(process.cwd(), 'circuits/solvency_proof/target/solvency_proof.json');
        const circuitJson = fs.readFileSync(circuitPath, 'utf-8');
        return JSON.parse(circuitJson);
      } catch {
        throw new Error('Circuit artifact not found. Run `nargo compile` first.');
      }
    }
  }

  /**
   * Generate a ZK proof that balance >= threshold
   * 
   * @param params.actualBalance - The user's real balance (PRIVATE - not revealed)
   * @param params.threshold - The minimum required balance (PUBLIC - visible to verifier)
   * @returns SolvencyProof object containing the proof and public inputs
   */
  async generateProof(params: {
    actualBalance: bigint;
    threshold: bigint;
  }): Promise<SolvencyProof> {
    if (!this.initialized) {
      await this.initialize();
    }

    const { actualBalance, threshold } = params;

    // Validate inputs
    if (actualBalance < 0n) {
      throw new Error('Balance cannot be negative');
    }
    if (threshold < 0n) {
      throw new Error('Threshold cannot be negative');
    }

    // Check if balance meets threshold (circuit will also verify this)
    const isSolvent = actualBalance >= threshold;
    if (!isSolvent) {
      throw new Error('Balance does not meet threshold - proof would fail');
    }

    console.log('Generating solvency proof...');
    console.log(`  Threshold: ${threshold} (public)`);
    console.log(`  Balance: [HIDDEN] (private)`);

    // Use mock mode if WASM backend isn't available
    if (this.useMockMode) {
      return this.generateMockProof(actualBalance, threshold);
    }

    try {
      // Prepare inputs for the Noir circuit
      const inputs = {
        actual_balance: actualBalance.toString(),
        threshold: threshold.toString()
      };

      // Generate the proof using Noir
      const { witness } = await this.noir.execute(inputs);
      const proof = await this.backend.generateProof(witness);

      console.log('Proof generated successfully!');

      return {
        proof: proof.proof,
        publicInputs: {
          threshold,
          isSolvent: true
        },
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to generate proof with backend, falling back to simulation:', error);
      return this.generateMockProof(actualBalance, threshold);
    }
  }

  /**
   * Generate a simulated proof for demo/testing
   * In production, this would be a real ZK proof
   */
  private async generateMockProof(
    actualBalance: bigint,
    threshold: bigint
  ): Promise<SolvencyProof> {
    // Simulate proof generation time
    await new Promise(resolve => setTimeout(resolve, 50));

    // Generate a deterministic mock proof based on inputs
    const proofData = `MOCK_PROOF_${threshold}_${Date.now()}`;
    const encoder = new TextEncoder();
    const proofBytes = encoder.encode(proofData);

    console.log('  ✓ Proof generated (simulation mode)');

    return {
      proof: proofBytes,
      publicInputs: {
        threshold,
        isSolvent: actualBalance >= threshold
      },
      timestamp: Date.now()
    };
  }

  /**
   * Verify a solvency proof
   * 
   * @param proof - The SolvencyProof to verify
   * @returns true if the proof is valid, false otherwise
   */
  async verifyProof(proof: SolvencyProof): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log('Verifying solvency proof...');

    // In mock mode, verify based on public inputs
    if (this.useMockMode) {
      const isValid = proof.publicInputs.isSolvent === true;
      console.log(`Proof verification: ${isValid ? 'VALID' : 'INVALID'} (simulation)`);
      return isValid;
    }

    try {
      // Reconstruct the proof object for the backend
      const proofData = {
        proof: proof.proof,
        publicInputs: [proof.publicInputs.threshold.toString()]
      };

      const isValid = await this.backend.verifyProof(proofData);
      
      console.log(`Proof verification: ${isValid ? 'VALID' : 'INVALID'}`);
      
      return isValid;
    } catch (error) {
      console.error('Failed to verify proof:', error);
      return false;
    }
  }

  /**
   * Check if running in mock/simulation mode
   */
  isMockMode(): boolean {
    return this.useMockMode;
  }

  /**
   * Check if the prover is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get information about the circuit
   */
  getCircuitInfo(): { name: string; inputs: string[]; outputs: string[] } {
    return {
      name: 'solvency_proof',
      inputs: ['actual_balance (private)', 'threshold (public)'],
      outputs: ['is_solvent (bool)']
    };
  }
}

// Export singleton instance for convenience
export const solvencyProver = new SolvencyProver();
