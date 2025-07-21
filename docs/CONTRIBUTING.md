# Contributing to Rush Policy Chat Assistant

Thank you for your interest in contributing to the Rush Policy Chat Assistant! This document provides guidelines and instructions for contributing to this project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## 📜 Code of Conduct

By participating in this project, you agree to:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/rush-policy-chat.git
   cd rush-policy-chat
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-owner/rush-policy-chat.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 💻 Development Process

### Setting Up Development Environment

1. Copy `.env.example` to `.env.local`
2. Add your development Azure OpenAI credentials
3. Run `npm run dev` to start the development server

### Making Changes

1. **Keep changes focused**: One feature or fix per pull request
2. **Write clear commit messages**: Use conventional commits format
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `style:` for formatting changes
   - `refactor:` for code refactoring
   - `test:` for adding tests
   - `chore:` for maintenance tasks

### Code Style

- Use ESLint and Prettier for consistent formatting
- Follow the existing code style in the project
- Use meaningful variable and function names
- Add comments for complex logic

## 🔄 Pull Request Process

1. **Update your fork**:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Rebase your feature branch**:
   ```bash
   git checkout feature/your-feature-name
   git rebase main
   ```

3. **Run tests and linting**:
   ```bash
   npm run lint
   npm run test
   ```

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** on GitHub

### PR Requirements

- Clear title and description
- Reference any related issues
- Include screenshots for UI changes
- All tests passing
- No merge conflicts
- Code review approval from maintainers

## 📐 Coding Standards

### JavaScript/React

- Use functional components with hooks
- Implement proper error handling
- Avoid inline styles where possible
- Use semantic HTML elements
- Ensure accessibility (ARIA labels, keyboard navigation)

### API Routes

- Validate all inputs
- Return appropriate status codes
- Include error messages for debugging
- Log important events
- Handle timeouts gracefully

### Security

- Never commit secrets or API keys
- Validate and sanitize all user inputs
- Use HTTPS for all external requests
- Follow OWASP security best practices

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- ChatInterface.test.js
```

### Writing Tests

- Write tests for new features
- Update tests when modifying existing features
- Aim for good test coverage
- Test edge cases and error scenarios

### Testing Guidelines

- Unit tests for utility functions
- Integration tests for API routes
- Component tests for React components
- E2E tests for critical user flows

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for functions
- Document complex algorithms
- Include examples in comments where helpful

### README Updates

Update the README when you:
- Add new features
- Change setup requirements
- Modify environment variables
- Update dependencies

### API Documentation

Document all API endpoints with:
- Request/response examples
- Required parameters
- Error responses
- Rate limits

## 🤝 Getting Help

- Create an issue for bugs or feature requests
- Join discussions in existing issues
- Ask questions in pull requests
- Contact maintainers for guidance

## 🎉 Recognition

Contributors will be:
- Listed in the project's contributors section
- Mentioned in release notes
- Given credit in relevant documentation

Thank you for contributing to Rush Policy Chat Assistant!