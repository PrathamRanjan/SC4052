from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import time
import json
import traceback
import os
import re

# Configure the app
app = Flask(__name__)
CORS(app)

# API configuration
GROQ_API_KEY = ""
GROQ_API_URL = ""
MODEL_NAME = ""  # Corrected model name
SERPER_API_KEY = ""

# System prompts
DEBATE_SYSTEM_PROMPT = """You are a skilled debate opponent participating in a structured debate.
Your role is to:
1. Present compelling counterarguments to the user's position
2. Maintain a respectful and intellectual tone
3. Support your arguments with evidence when possible
4. Stay focused on the current topic
5. Occasionally acknowledge good points made by the opponent
6. Present nuanced views rather than extreme positions
7. When you cite facts or statistics, ONLY use information that has been verified through fact-checking

Format your responses as clear, well-structured arguments without being overly verbose.
Current debate topic: {topic}
"""

JUDGE_SYSTEM_PROMPT = """You are an impartial debate judge evaluating a debate between a human and an AI.
Your task is to:
1. Carefully review all arguments made by both sides
2. Evaluate the quality, coherence, and evidence supporting each position
3. Consider logical fallacies and the strength of reasoning
4. Determine a winner based on the quality of argumentation, not your personal view on the topic
5. Provide a detailed explanation of your decision
6. Offer constructive feedback for both participants

Your judgment should be fair, focusing purely on the quality of argumentation rather than which side you personally agree with.
Current debate topic: {topic}
"""

CHATBOT_SYSTEM_PROMPT = """You are Sentinel AI, a helpful assistant specializing in misinformation detection, fact-checking methods, and media literacy. 
Your goal is to help users understand how to identify false information, evaluate sources, and develop critical thinking skills. 
Keep your responses concise, informative, and focused on empowering users to combat misinformation. 
Provide specific examples and actionable advice when possible.
"""

FACT_EXTRACTION_PROMPT = """Your task is to identify factual claims in the following message that should be verified.
Only extract specific, verifiable factual assertions - NOT opinions, personal experiences, or hypotheticals.

For each factual claim you identify:
1. Extract the exact statement that contains the factual assertion
2. Make sure it is something that can be objectively verified through research
3. Format each extraction as a search query that would be effective for fact-checking

Return your response in this exact JSON format:
{
  "factual_claims": [
    {
      "claim": "The exact factual claim from the text",
      "search_query": "An effective search query to verify this claim"
    }
  ]
}

If there are no verifiable factual claims, return:
{
  "factual_claims": []
}

Remember: Focus only on FACTUAL claims that can be objectively verified through research.
"""

# Helper functions
def call_groq_api(messages, model=MODEL_NAME, temperature=0.7, max_tokens=800):
    """
    Make a call to the Groq API with the provided messages
    """
    try:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        response = requests.post(GROQ_API_URL, headers=headers, json=payload)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"API request failed with status code: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        traceback.print_exc()
        return None

def search_with_serper(query):
    """
    Make a call to the Serper API to search for information
    """
    try:
        print(f"🔍 Searching with Serper API: {query}")
        url = "https://google.serper.dev/search"
        headers = {
            'X-API-KEY': SERPER_API_KEY,
            'Content-Type': 'application/json'
        }
        payload = {
            'q': query,
            'num': 5  # Limit to top 5 results for efficiency
        }
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Serper API returned {len(data.get('organic', []))} results")
            return data
        else:
            print(f"❌ Serper API request failed: {response.status_code}")
            return None
    
    except Exception as e:
        print(f"❌ Error in Serper API: {e}")
        traceback.print_exc()
        return None

def extract_factual_claims(text):
    """
    Extract factual claims from text that should be verified
    """
    try:
        messages = [
            {"role": "system", "content": FACT_EXTRACTION_PROMPT},
            {"role": "user", "content": text}
        ]
        
        response = call_groq_api(messages, temperature=0.1)
        
        if not response or 'choices' not in response or len(response['choices']) == 0:
            print("Failed to extract factual claims")
            return []
        
        result = response['choices'][0]['message']['content']
        
        # Extract JSON from the response
        try:
            # Find JSON in the response
            json_match = re.search(r'({[\s\S]*})', result)
            if json_match:
                json_str = json_match.group(1)
                data = json.loads(json_str)
                
                if 'factual_claims' in data and isinstance(data['factual_claims'], list):
                    return data['factual_claims']
            
            return []
        except Exception as e:
            print(f"Error parsing factual claims JSON: {e}")
            return []
    
    except Exception as e:
        print(f"Error extracting factual claims: {e}")
        return []

def verify_factual_claims(claims):
    """
    Verify a list of factual claims using Serper API
    """
    results = []
    
    for claim_obj in claims:
        claim = claim_obj.get('claim', '')
        search_query = claim_obj.get('search_query', claim)
        
        print(f"Verifying claim: {claim}")
        
        # Search for information about the claim
        search_results = search_with_serper(search_query)
        
        if not search_results or 'organic' not in search_results or len(search_results['organic']) == 0:
            results.append({
                "claim": claim,
                "verified": False,
                "status": "UNVERIFIED",
                "reason": "No search results found",
                "sources": []
            })
            continue
        
        # Prepare a summary of the search results
        search_summary = []
        sources = []
        
        for idx, result in enumerate(search_results.get('organic', [])[:3]):
            title = result.get('title', 'Unknown Title')
            snippet = result.get('snippet', 'No snippet available')
            link = result.get('link', '#')
            
            search_summary.append(f"Result {idx+1}: {title}\nSnippet: {snippet}\nURL: {link}\n")
            
            sources.append({
                "title": title,
                "link": link
            })
        
        # Use Groq to evaluate the claim based on search results
        eval_messages = [
            {"role": "system", "content": """You are a fact-checking assistant. Your task is to evaluate the factual accuracy of a claim based on search results.
Provide a concise assessment indicating whether the claim is TRUE, FALSE, or UNVERIFIED.
Return your response as a valid JSON object with the following fields:
1. status: "TRUE", "FALSE", or "UNVERIFIED"
2. confidence: A number from 0-10 indicating how confident you are in this assessment
3. reason: A 1-2 sentence explanation of your assessment"""},
            {"role": "user", "content": f"Claim to verify: {claim}\n\nSearch Results:\n{''.join(search_summary)}"}
        ]
        
        response = call_groq_api(eval_messages, temperature=0.1)
        
        if not response or 'choices' not in response or len(response['choices']) == 0:
            results.append({
                "claim": claim,
                "verified": False,
                "status": "UNVERIFIED",
                "reason": "Failed to evaluate claim",
                "sources": sources
            })
            continue
        
        evaluation = response['choices'][0]['message']['content']
        
        # Extract JSON from the evaluation
        try:
            json_match = re.search(r'({[\s\S]*})', evaluation)
            if json_match:
                json_str = json_match.group(1)
                data = json.loads(json_str)
                
                status = data.get('status', 'UNVERIFIED')
                confidence = data.get('confidence', 5)
                reason = data.get('reason', 'No reason provided')
                
                results.append({
                    "claim": claim,
                    "verified": True,
                    "status": status,
                    "confidence": confidence,
                    "reason": reason,
                    "sources": sources
                })
            else:
                # If JSON parsing fails, try to extract status manually
                status = "UNVERIFIED"
                reason = "Could not determine from search results"
                
                if "TRUE" in evaluation.upper():
                    status = "TRUE"
                elif "FALSE" in evaluation.upper():
                    status = "FALSE"
                
                # Extract a reason if possible
                reason_match = re.search(r'reason:?\s*([^\n]+)', evaluation, re.IGNORECASE)
                if reason_match:
                    reason = reason_match.group(1)
                
                results.append({
                    "claim": claim,
                    "verified": True,
                    "status": status,
                    "reason": reason,
                    "sources": sources
                })
        except Exception as e:
            print(f"Error parsing evaluation: {e}")
            results.append({
                "claim": claim,
                "verified": False,
                "status": "UNVERIFIED",
                "reason": "Error evaluating claim",
                "sources": sources
            })
    
    return results

# Debate API routes
@app.route('/api/debate/start', methods=['POST'])
def start_debate():
    """Start a new debate with the given topic"""
    data = request.json
    
    if not data or 'topic' not in data:
        return jsonify({"error": "Missing topic parameter"}), 400
    
    topic = data['topic']
    print(f"Starting new debate on topic: {topic}")
    
    try:
        # Generate the AI's opening statement
        messages = [
            {"role": "system", "content": DEBATE_SYSTEM_PROMPT.format(topic=topic)},
            {"role": "user", "content": f"Let's debate the topic: {topic}. Please provide your opening statement, taking the opposing view to stimulate debate."}
        ]
        
        response = call_groq_api(messages)
        
        if not response or 'choices' not in response or len(response['choices']) == 0:
            return jsonify({"error": "Failed to generate opening statement"}), 500
        
        ai_message = response['choices'][0]['message']['content']
        
        return jsonify({
            "success": True,
            "topic": topic,
            "opening_statement": ai_message,
            "debate_id": str(int(time.time())),  # Simple ID generation
            "timestamp": time.time()
        })
        
    except Exception as e:
        print(f"Error starting debate: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/debate/respond', methods=['POST'])
def debate_respond():
    """Generate an AI response to the user's argument with optional fact-checking"""
    data = request.json
    
    if not data or 'topic' not in data or 'messages' not in data:
        return jsonify({"error": "Missing required parameters"}), 400
    
    topic = data['topic']
    messages = data['messages']
    
    # Validate the message format
    if not all(isinstance(m, dict) and 'role' in m and 'content' in m for m in messages):
        return jsonify({"error": "Invalid message format"}), 400
    
    try:
        # Get the latest user message
        user_messages = [m for m in messages if m['role'] == 'user']
        if not user_messages:
            return jsonify({"error": "No user messages found"}), 400
        
        latest_user_message = user_messages[-1]['content']
        
        # Extract factual claims from the user message
        factual_claims = extract_factual_claims(latest_user_message)
        
        # If factual claims are found, verify them
        fact_check_results = []
        if factual_claims:
            print(f"Found {len(factual_claims)} factual claims to verify")
            fact_check_results = verify_factual_claims(factual_claims)
        
        # Add factual verification information to the system prompt if available
        system_prompt = DEBATE_SYSTEM_PROMPT.format(topic=topic)
        if fact_check_results:
            system_prompt += "\n\nFact-check results for claims in the user's last message (USE THIS INFORMATION IN YOUR RESPONSE):\n"
            for idx, result in enumerate(fact_check_results):
                system_prompt += f"\nClaim {idx+1}: {result['claim']}\n"
                system_prompt += f"Status: {result['status']}\n"
                system_prompt += f"Reason: {result['reason']}\n"
                
                if result['sources']:
                    system_prompt += "Sources:\n"
                    for source in result['sources'][:2]:  # Limit to 2 sources
                        system_prompt += f"- {source['title']}\n"
        
        # Prepare messages for the API
        formatted_messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add the conversation history
        for message in messages:
            formatted_messages.append({
                "role": message['role'],
                "content": message['content']
            })
        
        response = call_groq_api(formatted_messages)
        
        if not response or 'choices' not in response or len(response['choices']) == 0:
            return jsonify({"error": "Failed to generate response"}), 500
        
        ai_message = response['choices'][0]['message']['content']
        
        return jsonify({
            "success": True,
            "response": ai_message,
            "fact_checks": fact_check_results,
            "timestamp": time.time()
        })
        
    except Exception as e:
        print(f"Error generating debate response: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/debate/judge', methods=['POST'])
def judge_debate():
    """Judge the debate and determine a winner"""
    data = request.json
    
    if not data or 'topic' not in data or 'messages' not in data:
        return jsonify({"error": "Missing required parameters"}), 400
    
    topic = data['topic']
    messages = data['messages']
    
    try:
        # Format the debate transcript for the judge
        debate_transcript = ""
        for idx, message in enumerate(messages):
            if message['role'] == 'system':
                continue
                
            speaker = "Human" if message['role'] == 'user' else "AI"
            debate_transcript += f"{speaker}: {message['content']}\n\n"
        
        # Prepare judge prompt
        judge_messages = [
            {"role": "system", "content": JUDGE_SYSTEM_PROMPT.format(topic=topic)},
            {"role": "user", "content": f"Topic: {topic}\n\nDebate Transcript:\n{debate_transcript}\n\nPlease judge this debate. Determine a winner based on the quality of argumentation, provide a score for each side (on a scale from 50-100), explain your reasoning in detail, and offer constructive feedback for both participants."}
        ]
        
        response = call_groq_api(judge_messages, temperature=0.3, max_tokens=1200)
        
        if not response or 'choices' not in response or len(response['choices']) == 0:
            return jsonify({"error": "Failed to generate judgment"}), 500
        
        judgment_text = response['choices'][0]['message']['content']
        
        # Process judgment to extract scores and winner
        try:
            # Try to extract scores using simple heuristics
            human_score, ai_score = 50, 50  # Default scores
            winner = None
            
            if "human score" in judgment_text.lower() or "user score" in judgment_text.lower():
                # Look for patterns like "Human score: 85" or "User score: 85"
                for line in judgment_text.split('\n'):
                    line = line.lower()
                    if "human score" in line or "user score" in line:
                        try:
                            human_score = int(line.split(':')[1].strip().split('/')[0])
                        except:
                            pass
                    if "ai score" in line:
                        try:
                            ai_score = int(line.split(':')[1].strip().split('/')[0])
                        except:
                            pass
            
            # Determine winner based on scores or mention in text
            if human_score > ai_score:
                winner = 'user'
            elif ai_score > human_score:
                winner = 'ai'
            else:
                # Try to determine from text
                if "human wins" in judgment_text.lower() or "user wins" in judgment_text.lower():
                    winner = 'user'
                elif "ai wins" in judgment_text.lower():
                    winner = 'ai'
                else:
                    winner = 'tie'
            
            # Extract reasoning and feedback
            reasoning = judgment_text
            improvements = ""
            
            if "feedback" in judgment_text.lower():
                parts = judgment_text.lower().split("feedback")
                if len(parts) > 1:
                    improvements = parts[1]
            
            judgment = {
                "winner": winner,
                "userScore": human_score,
                "aiScore": ai_score,
                "reasoning": reasoning,
                "improvements": improvements or "Focus on providing more specific evidence to support your claims and addressing your opponent's strongest arguments directly."
            }
            
        except Exception as e:
            print(f"Error parsing judgment: {e}")
            # Fallback judgment
            judgment = {
                "winner": "tie",
                "userScore": 75,
                "aiScore": 75,
                "reasoning": judgment_text,
                "improvements": "Both sides presented compelling arguments. For future debates, focus on providing more specific evidence."
            }
        
        return jsonify({
            "success": True,
            "judgment": judgment,
            "full_text": judgment_text,
            "timestamp": time.time()
        })
        
    except Exception as e:
        print(f"Error judging debate: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Chatbot API route
@app.route('/api/chatbot/message', methods=['POST'])
def chatbot_message():
    """Process a message for the chatbot"""
    data = request.json
    
    if not data or 'messages' not in data:
        return jsonify({"error": "Missing messages parameter"}), 400
    
    messages = data['messages']
    
    try:
        # Prepare messages for the API
        formatted_messages = [
            {"role": "system", "content": CHATBOT_SYSTEM_PROMPT}
        ]
        
        # Add the conversation history
        for message in messages:
            if isinstance(message, dict) and 'role' in message and 'content' in message:
                formatted_messages.append({
                    "role": message['role'],
                    "content": message['content']
                })
        
        response = call_groq_api(formatted_messages)
        
        if not response or 'choices' not in response or len(response['choices']) == 0:
            return jsonify({"error": "Failed to generate response"}), 500
        
        ai_message = response['choices'][0]['message']['content']
        
        return jsonify({
            "success": True,
            "response": {
                "role": "assistant",
                "content": ai_message
            },
            "timestamp": time.time()
        })
        
    except Exception as e:
        print(f"Error generating chatbot response: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5003))
    print(f"🚀 Starting Debate and Chatbot Server on port {port}")
    print("Debate endpoints: /api/debate/start, /api/debate/respond, /api/debate/judge")
    print("Chatbot endpoint: /api/chatbot/message")
    app.run(host='0.0.0.0', port=port, debug=True)