# smartfix/AI_BACKEND/api/chatbot.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import requests
import os
from datetime import datetime

router = APIRouter()

# System Backend URL
SYSTEM_BACKEND_URL = os.getenv('SYSTEM_BACKEND_URL', 'http://localhost:8080')

# Store conversation history (in production, use a database)
conversation_history = {}

class ChatMessage(BaseModel):
    message: str
    sessionId: str

class ChatResponse(BaseModel):
    response: str
    suggestions: List[str]
    timestamp: str

def fetch_available_devices():
    """Fetch real devices from System Backend"""
    try:
        response = requests.get(f'{SYSTEM_BACKEND_URL}/api/inventory', timeout=5)
        if response.status_code == 200:
            devices = response.json()
            # Only return devices with quantity > 0
            return [d for d in devices if d.get('quantity', 0) > 0]
        return []
    except Exception as e:
        print(f"Error fetching devices: {e}")
        return []

def format_device_list(devices: List[Dict]) -> str:
    """Format devices into a readable list"""
    if not devices:
        return "We currently don't have devices in stock. Please check back soon or contact us for more information."
    
    # Group by category
    categories = {}
    for device in devices:
        category = device.get('category', {})
        if isinstance(category, dict):
            cat_name = category.get('name', 'Other')
        else:
            cat_name = str(category) if category else 'Other'
        
        if cat_name not in categories:
            categories[cat_name] = []
        categories[cat_name].append(device)
    
    # Format output
    result = "Here are our available devices:\n\n"
    for category, items in categories.items():
        result += f"**{category}**:\n"
        for item in items[:5]:  # Show max 5 per category
            name = item.get('name', 'Unknown')
            price = item.get('price', 0)
            qty = item.get('quantity', 0)
            result += f"• {name} - {price:,.0f} RWF ({qty} available)\n"
        if len(items) > 5:
            result += f"• ...and {len(items) - 5} more\n"
        result += "\n"
    
    return result.strip()

def search_devices(query: str) -> List[Dict]:
    """Search devices by name or category"""
    devices = fetch_available_devices()
    query_lower = query.lower()
    
    results = []
    for device in devices:
        name = device.get('name', '').lower()
        category = device.get('category', {})
        if isinstance(category, dict):
            cat_name = category.get('name', '').lower()
        else:
            cat_name = str(category).lower() if category else ''
        
        if query_lower in name or query_lower in cat_name:
            results.append(device)
    
    return results

def format_search_results(devices: List[Dict], query: str) -> str:
    """Format search results"""
    if not devices:
        return f"I couldn't find any devices matching '{query}' in our current inventory. Would you like to see all available devices or search for something else?"
    
    result = f"I found {len(devices)} device(s) matching '{query}':\n\n"
    for device in devices[:10]:  # Show max 10 results
        name = device.get('name', 'Unknown')
        price = device.get('price', 0)
        qty = device.get('quantity', 0)
        category = device.get('category', {})
        if isinstance(category, dict):
            cat_name = category.get('name', 'Unknown')
        else:
            cat_name = str(category) if category else 'Unknown'
        
        result += f"• **{name}**\n"
        result += f"  Category: {cat_name}\n"
        result += f"  Price: {price:,.0f} RWF\n"
        result += f"  Available: {qty} units\n\n"
    
    return result.strip()

# Keywords for intent detection
GREETING_KEYWORDS = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'start']
THANKS_KEYWORDS = ['thank', 'thanks', 'appreciate', 'grateful']
GOODBYE_KEYWORDS = ['bye', 'goodbye', 'see you', 'later']
DEVICE_KEYWORDS = ['device', 'phone', 'laptop', 'computer', 'tablet', 'watch', 'product', 'sell', 'buy', 'available', 'stock', 'have']
PRICE_KEYWORDS = ['price', 'cost', 'how much', 'expensive', 'cheap', 'affordable']
LOCATION_KEYWORDS = ['location', 'where', 'address', 'find you', 'visit', 'store']
CONTACT_KEYWORDS = ['contact', 'call', 'phone', 'email', 'reach']
REPAIR_KEYWORDS = ['repair', 'fix', 'broken', 'damage', 'service']

def save_conversation(session_id: str, user_message: str, bot_response: str):
    """Save conversation to history"""
    if session_id not in conversation_history:
        conversation_history[session_id] = []
    
    conversation_history[session_id].append({
        'user': user_message,
        'bot': bot_response,
        'timestamp': datetime.now().isoformat()
    })
    
    # Keep only last 10 messages per session
    if len(conversation_history[session_id]) > 10:
        conversation_history[session_id] = conversation_history[session_id][-10:]

def find_best_response(message: str) -> tuple:
    """Find the best response based on keywords and real data"""
    message_lower = message.lower()
    
    # Check for greetings
    if any(keyword in message_lower for keyword in GREETING_KEYWORDS):
        return (
            "Welcome to Corex Ltd! 👋\n\nWhat electronic devices are you looking for?\n\nI can help you find smartphones, laptops, tablets, smartwatches, and accessories from our current inventory.",
            ['Show all devices', 'I need a smartphone', 'Looking for laptop', 'Where is your store?']
        )
    
    # Check for thanks
    if any(keyword in message_lower for keyword in THANKS_KEYWORDS):
        return (
            "You're welcome! Is there anything else I can help you with?",
            ['Show all devices', 'Store location', 'Contact information']
        )
    
    # Check for goodbye
    if any(keyword in message_lower for keyword in GOODBYE_KEYWORDS):
        return (
            "Thank you for chatting with Corex Ltd! Feel free to visit our store or contact us anytime. Have a great day! 👋",
            []
        )
    
    # Check for specific device search
    search_terms = ['iphone', 'macbook', 'samsung', 'dell', 'hp', 'lenovo', 'ipad', 'airpods', 'watch']
    for term in search_terms:
        if term in message_lower:
            devices = search_devices(term)
            response = format_search_results(devices, term)
            return (
                response,
                ['Show all devices', 'Tell me about repairs', 'Where is your store?']
            )
    
    # Check for device listing request
    if any(keyword in message_lower for keyword in DEVICE_KEYWORDS):
        devices = fetch_available_devices()
        response = format_device_list(devices)
        return (
            response,
            ['Tell me about iPhone', 'Show me laptops', 'What are the prices?']
        )
    
    # Check for location
    if any(keyword in message_lower for keyword in LOCATION_KEYWORDS):
        return (
            "📍 **Visit Our Store**\n\n**Address**: Kigali, Rwanda\n**Phone**: +250 XXX XXX XXX\n\n🕐 **Business Hours**:\n• Monday - Friday: 8:00 AM - 6:00 PM\n• Saturday: 9:00 AM - 5:00 PM\n• Sunday: Closed\n\nWe're conveniently located in the city center. Call us for directions!",
            ['Show me devices', 'What are your prices?', 'Do you repair devices?']
        )
    
    # Check for contact
    if any(keyword in message_lower for keyword in CONTACT_KEYWORDS):
        return (
            "📞 **Contact Us**\n\n**Phone**: +250 XXX XXX XXX\n**Email**: info@corexltd.rw\n**WhatsApp**: +250 XXX XXX XXX\n\n**Best Times to Call**:\n• Monday - Friday: 8:00 AM - 6:00 PM\n• Saturday: 9:00 AM - 5:00 PM\n\nWe're here to help!",
            ['Where is your store?', 'Show me devices', 'Business hours']
        )
    
    # Check for repair services
    if any(keyword in message_lower for keyword in REPAIR_KEYWORDS):
        return (
            "🔧 **Repair Services**\n\nWe provide professional repair services:\n\n• Screen replacement\n• Battery replacement\n• Water damage repair\n• Software troubleshooting\n• Hardware diagnostics\n\n**Why Choose Us**:\n• Expert technicians\n• Genuine parts\n• Fast turnaround\n• 90-day warranty\n• Free diagnostics\n\nBring your device to our store for a free assessment!",
            ['How much does repair cost?', 'Where is your store?', 'Show me devices']
        )
    
    # Check for price inquiry
    if any(keyword in message_lower for keyword in PRICE_KEYWORDS):
        devices = fetch_available_devices()
        if devices:
            # Get price range
            prices = [d.get('price', 0) for d in devices]
            min_price = min(prices)
            max_price = max(prices)
            return (
                f"💰 **Our Pricing**\n\nOur devices range from {min_price:,.0f} RWF to {max_price:,.0f} RWF.\n\n**Payment Options**:\n• Cash\n• Mobile Money (MTN, Airtel)\n• Bank transfer\n\nWould you like to see specific devices and their prices?",
                ['Show all devices', 'I need iPhone', 'Looking for laptop']
            )
    
    # Default response - show devices
    devices = fetch_available_devices()
    if devices:
        return (
            "I can help you find the perfect device! Here's what we have:\n\n" + format_device_list(devices),
            ['Tell me about iPhone', 'Show me laptops', 'Where is your store?']
        )
    else:
        return (
            "I'd be happy to help! I can provide information about:\n\n• Our available devices\n• Repair services\n• Store location and hours\n• Contact information\n\nWhat would you like to know?",
            ['Show devices', 'Repair services', 'Store location', 'Contact us']
        )

@router.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Handle chat messages"""
    try:
        user_message = message.message.strip()
        session_id = message.sessionId
        
        if not user_message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Get response
        response_text, suggestions = find_best_response(user_message)
        
        # Save conversation
        save_conversation(session_id, user_message, response_text)
        
        return ChatResponse(
            response=response_text,
            suggestions=suggestions,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Sorry, I'm experiencing technical difficulties. Please try again."
        )

@router.get("/suggestions")
async def get_suggestions():
    """Get initial conversation suggestions"""
    return {
        'suggestions': [
            'Show all devices',
            'I need a smartphone',
            'Looking for laptop',
            'Where is your store?',
            'What are your prices?',
            'Do you repair devices?'
        ]
    }

@router.get("/test")
async def test_chatbot():
    """Test endpoint to verify chatbot is working"""
    devices = fetch_available_devices()
    return {
        'status': 'online',
        'message': 'Chatbot API is working!',
        'devices_available': len(devices),
        'system_backend': SYSTEM_BACKEND_URL,
        'timestamp': datetime.now().isoformat()
    }
