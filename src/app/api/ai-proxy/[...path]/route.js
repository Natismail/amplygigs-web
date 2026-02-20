import { NextResponse } from 'next/server';

//const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
//const AI_API_KEY = process.env.AI_API_KEY || 'dev-key-12345';

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
const AI_API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY || 'dev-key-12345';


export async function GET(request, { params }) {
  const path = params.path.join('/');
  
  try {
    const response = await fetch(`${AI_SERVICE_URL}/${path}`, {
      method: 'GET',
      headers: {
        'X-API-Key': AI_API_KEY,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'AI service unavailable' },
      { status: 503 }
    );
  }
}

export async function POST(request, { params }) {
  const path = params.path.join('/');
  const body = await request.json();
  
  try {
    const response = await fetch(`${AI_SERVICE_URL}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': AI_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'AI service unavailable' },
      { status: 503 }
    );
  }
}