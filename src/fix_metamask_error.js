// This script attempts to catch and silence the specific MetaMask connection error
// that occurs when the extension is in an invalid state or not found during a connection attempt.

if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', function (event) {
        // Check if the error is related to MetaMask
        if (event.reason && (
            (event.reason.message && event.reason.message.includes('MetaMask')) ||
            (event.reason.stack && event.reason.stack.includes('MetaMask')) ||
            (event.reason.toString().includes('MetaMask'))
        )) {
            // Prevent the default console error
            event.preventDefault();
            console.warn('Suppressing unhandled MetaMask error:', event.reason);
        }
    });
}
