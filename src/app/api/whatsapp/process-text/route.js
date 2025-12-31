export async function POST(req) {
    try {
        const body = await req.json();
        const { text, messageId, audio } = body;

        console.log(`[Bot Mock] Processing: ${text}`);

        // Simple mock response
        // In real world, this would process natural language

        return Response.json({
            success: true,
            message: "Recebido pelo servidor com sucesso!",
            originalText: text
        });

    } catch (error) {
        return Response.json({ error: 'Failed to process' }, { status: 500 });
    }
}
