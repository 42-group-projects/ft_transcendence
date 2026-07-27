export function handleValidationError(result: any, c: any) {
    if (!result.success) {
        const first = result.error.issues[0];
        return c.json({ error: first?.message ?? 'Invalid request data' }, 400);
    }
}
