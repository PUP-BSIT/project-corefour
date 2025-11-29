AppDev Coding Guidelines

General TypeScript & Angular Rules

Strict Typing:

Never use the any or Object type.

Always specify types for every function parameter.

Specifying return types for validator functions is mandatory.

Use type keyword to structure an object instead of interface.

Naming Conventions:

Enums: PascalCase for the enum name, UPPER_SNAKE_CASE for elements (e.g., Status.ACTIVE_USER).git 

Classes/Types/Decorators: Always use PascalCase.

Comments:

Use TODO comments in this format:
// TODO(Lastname, Givenname): What needs to be done (TS)

<!-- TODO(Lastname, Givenname): What needs to be done --> (HTML)

Angular Best Practices

Control Flow:

FORBIDDEN: *ngIf, *ngFor.

REQUIRED: Use the built-in control flow: @if, @for(item of items; track item.id).

Styling:

FORBIDDEN: ngStyle (use ngClass instead).

Encapsulation: If using ::ng-deep, it MUST be wrapped in a :host container to ensure encapsulation.

Forms:

Always use Reactive Forms with FormBuilder.

Validators must return { error_code: 'message' } or null.

HTTP & Services:

Always create a model/type for HTTP responses.

Never use HttpClient directly in a component; strictly use Services.

RxJS:

FORBIDDEN: Nested subscriptions (subscribing inside a subscribe).

REQUIRED: Use pipe() and RxJS operators (switchMap, mergeMap, etc.) to chain operations.

No Vanilla JS:

Do not use querySelector, getElementById, or addEventListener. Use Angular refs and bindings.

Formatting & Structure

Line Length:

MAXIMUM: 80 characters per line.

Indentation:

When splitting elements to multiple lines, add at least a double tab (indentation) to indicate continuation.

Nesting max level: 3.

File Structure:

Group similar properties together (Inputs, Outputs, Observables, Private properties).