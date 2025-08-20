import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 Deep Chat API Request:', body);

    // Deep Chat sends messages in different formats, handle both
    let message: string;
    let history: any[] = [];

    if (body.messages && Array.isArray(body.messages)) {
      // Deep Chat format: { messages: [...] }
      const lastMessage = body.messages[body.messages.length - 1];
      message = lastMessage?.text || lastMessage?.content || '';
      history = body.messages.slice(0, -1); // All messages except the last one
    } else {
      // Legacy format: { message: "...", history: [...] }
      message = body.message || body.text || '';
      history = body.history || [];
    }

    if (!message.trim()) {
      throw new Error('No message content provided');
    }

    console.log('📝 Processing message:', message);
    console.log('📚 History length:', history.length);

    // Call Python personal SweatBot backend
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8765';
    
    const backendResponse = await fetch(`${pythonBackendUrl}/api/personal-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history: history || []
      }),
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend responded with status: ${backendResponse.status}`);
    }

    const data = await backendResponse.json();
    const responseText = data.response || 'תגובה לא זמינה';

    console.log('✅ Backend response:', responseText.substring(0, 100) + '...');

    // Return in Deep Chat expected format
    return NextResponse.json({
      // Deep Chat expects 'text' field
      text: responseText,
      role: 'ai',
      // Legacy compatibility
      response: responseText,
      success: true,
      // Additional metadata for Deep Chat
      html: responseText.replace(/\n/g, '<br>'), // Convert newlines to HTML
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Personal SweatBot API error:', error);
    
    const errorMessage = 'מצטער, יש בעיה בחיבור לשרת. אנא בדוק שהשרת הפייתון רץ על פורט 8765.';
    
    return NextResponse.json({
      text: errorMessage,
      role: 'ai',
      response: errorMessage,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}