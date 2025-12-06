# Contributing to zkScan

First off, thank you for considering contributing to zkScan! It's people like you that make zkScan such a great tool for the community.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps which reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed and what behavior you expected**
* **Include screenshots if relevant**
* **Include your environment details** (OS, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement**
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior and explain which behavior you expected to see**
* **Explain why this enhancement would be useful**

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the TypeScript styleguide
* Include thoughtful, well-written comments in your code
* Write meaningful commit messages
* Update documentation for any changed functionality
* Add tests for new features
* Ensure all tests pass before submitting

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/zkscan-sdk.git
cd zkscan-core

# Install dependencies
npm install

# Build circuits
npm run build:circuits

# Run tests
npm test

# Build TypeScript
npm run build
```

## Styleguide

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

Examples:
```
feat: add Pedersen commitment support
fix: resolve hash collision in Poseidon
docs: update API documentation
test: add tests for range proofs
refactor: optimize circuit constraints
```

### TypeScript Styleguide

* Use TypeScript strict mode
* Prefer `const` over `let`
* Use meaningful variable names
* Add JSDoc comments to all public functions
* Use async/await instead of promises
* Follow the existing code style

```typescript
/**
 * Calculate Poseidon hash of inputs
 *
 * @param {string[]} inputs - Array of string inputs
 * @returns {Promise<string>} Hash as hex string
 */
async function calculateHash(inputs: string[]): Promise<string> {
  // Implementation...
}
```

### Testing

* Write unit tests for all new functions
* Maintain test coverage above 90%
* Use descriptive test names
* Follow the AAA pattern (Arrange, Act, Assert)

```typescript
describe('ZKOperations', () => {
  describe('poseidonHash', () => {
    it('should generate consistent hashes for same input', async () => {
      // Arrange
      const input = ['test'];

      // Act
      const hash1 = await ZKOperations.poseidonHash(input);
      const hash2 = await ZKOperations.poseidonHash(input);

      // Assert
      expect(hash1).toBe(hash2);
    });
  });
});
```

## Circuit Development

When contributing circuits:

1. Use Circom 2.1.0+
2. Add comprehensive comments explaining the circuit logic
3. Minimize constraint count where possible
4. Include circuit documentation in comments
5. Test circuits with multiple input cases
6. Document constraint count and proving time

```circom
/**
 * MyCircuit - Brief description
 *
 * Detailed explanation of what this circuit proves.
 *
 * Constraints: ~XXX
 * Proving time: ~XXXms
 */
template MyCircuit() {
    // Circuit implementation...
}
```

## Documentation

* Update README.md if you change functionality
* Add JSDoc comments to all public APIs
* Update API.md for API changes
* Create examples for new features
* Keep documentation clear and concise

## Community

* Follow us on [Twitter](https://x.com/zkscanapp)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to ask!

Thank you for contributing to zkScan! 🙏
