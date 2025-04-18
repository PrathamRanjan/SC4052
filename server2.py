from flask import Flask, request, jsonify
import json
import re
import requests
from flask_cors import CORS
from openai import OpenAI
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
import traceback
import time
OPENAI_API_KEY = ""

GROQ_API_KEY = ""
GOOGLE_FACT_CHECK_API_KEY = ""
SERPER_API_KEY = ""

EXTRACT_CLAIMS_PROMPT = """
Analyze the provided text and extract 4-6 specific factual claims that can be verified.

For each claim:
1. Extract the exact statement from the text that can be verified as true or false
2. Make sure these are substantive factual claims, not opinions or subjective statements
3. Focus on claims that would be important for readers to know the accuracy of
4. IMPORTANT: Add sufficient context to each claim to make it clear what subject is being referenced
5. Include the subject of the claim explicitly

Return ONLY a JSON array in this exact format:
[
  {
    "claim": "The exact claim from the text with necessary context",
    "context": "A brief note explaining what this claim is about and any necessary context for understanding it",
    "search_query": "Suggested search terms to verify this claim"
  }
]

Do not attempt to verify the claims yourself. Just identify and contextualize them for verification.
"""

SERPER_VERIFICATION_PROMPT = """
You are a world-renowned fact-checker with a reputation for accuracy, clarity, and attention to detail.

I need you to fact-check the following claim using search results I've provided.

Claim: {{claim}}

Search Results: {{search_results}}

Based on these search results and your analysis, determine if the claim is TRUE, FALSE, or UNVERIFIED.

Your response must be in this exact JSON format:
{
  "claim": "{{claim}}",
  "result": "TRUE/FALSE/UNVERIFIED",
  "summary": "A concise one-sentence summary of your verdict. Vary your phrasing; don't always start with 'The evidence confirms/refutes'.",
  "detailed_analysis": "A detailed, evidence-based explanation of your reasoning (3-5 sentences). Provide specific details from the sources that support your conclusion.",
  "sources": [
    {
      "name": "Website or Publication Name",
      "url": "Source URL"
    },
    {
      "name": "Website or Publication Name",
      "url": "Source URL"
    }
  ]
}

Guidelines:
- Only mark a claim as TRUE if credible sources clearly support it
- Only mark a claim as FALSE if credible sources clearly refute it
- Mark as UNVERIFIED if the sources are contradictory, unclear, or insufficient
- Focus on the most authoritative sources (educational institutions, scientific publications, etc.)
- Extract the most relevant information from each source
- Vary your phrasing in the summary for natural reading
- In your detailed_analysis, be thorough yet concise - explain your reasoning with evidence
"""

LLAMA_CONTEXT_PROMPT = """
You are an expert in providing factual context and background information. You have just received a claim that has been fact-checked.

Claim: {{claim}}
Fact-Check Result: {{result}}
Fact-Check Summary: {{summary}}

Please provide additional context, details, or background information about this topic that would be helpful for someone trying to understand it better. Your response should:

1. Be factually accurate and educational
2. Add information that complements the fact-check
3. Provide historical context, related facts, or important nuances
4. Be neutral and objective
5. Be approximately 2-3 sentences in length

Your response will be added as "additional_context" in the fact-checking report.
"""

app = Flask(__name__)
CORS(app)  

client = OpenAI(api_key=OPENAI_API_KEY)

llm = ChatGroq(
    api_key=GROQ_API_KEY,
    model_name="llama-3.1-8b-instant"
)

def fix_broken_json(json_str):
    try:
        json.loads(json_str)
        return json_str
    except json.JSONDecodeError:
        fixed_str = re.sub(r'(".*?":\s*".*?")\s*\n\s*(".*?")',
                           r'\1,\n  \2', json_str)
        
        fixed_str = re.sub(r'(".*?":\s*[^",\s{[].*?[^,\s{[])(\s*\n\s*)(".*?")',
                           r'\1,\2\3', fixed_str)
        
        try:
            json.loads(fixed_str)
            return fixed_str
        except json.JSONDecodeError:
            try:
                obj_start = json_str.find('{')
                obj_end = json_str.rfind('}')
                if obj_start == -1 or obj_end == -1:
                    return json_str
                
                content = json_str[obj_start+1:obj_end].strip()
                
                properties = []
                current_prop = ""
                in_quotes = False
                quote_char = None
                for i, char in enumerate(content):
                    current_prop += char
                    
                    if char in ['"', "'"]:
                        if not in_quotes:
                            in_quotes = True
                            quote_char = char
                        elif char == quote_char and content[i-1] != '\\':
                            in_quotes = False
                            quote_char = None
                    
                    if not in_quotes and char == '"' and i > 0 and content[i-1:i+1] != '\\"':
                        lookahead = content[i:i+30]
                        if re.search(r'^"[^"]+"\s*:', lookahead):
                            if current_prop.strip():
                                properties.append(current_prop.strip())
                            current_prop = char
                
                if current_prop.strip():
                    properties.append(current_prop.strip())
                
                valid_properties = []
                for prop in properties:
                    if ":" in prop:
                        valid_properties.append(prop.strip().rstrip(','))
                
                fixed_str = "{\n  " + ",\n  ".join(valid_properties) + "\n}"
                
                json.loads(fixed_str)
                return fixed_str
            except:
                return json_str
    except Exception:
        return json_str

def extract_claims(text):
    try:
        print("🔍 Extracting claims from text...")
        print(f"📝 First 200 chars of text: {text[:200]}...")
        
        messages = [
            SystemMessage(content=EXTRACT_CLAIMS_PROMPT),
            HumanMessage(content=text)
        ]
        
        print("🤖 Sending to Llama 3.1 for claim extraction...")
        response = llm.invoke(messages)
        content = response.content
        
        print(f"🤖 Llama 3.1 response: {content}")
        
        start_idx = content.find('[')
        end_idx = content.rfind(']') + 1
        
        if start_idx >= 0 and end_idx > start_idx:
            json_str = content[start_idx:end_idx]
            claims = json.loads(json_str)
            print(f"✅ Extracted {len(claims)} claims:")
            for i, claim in enumerate(claims):
                print(f"  {i+1}. {claim.get('claim', 'No claim')}")
                if "context" in claim:
                    print(f"     Context: {claim.get('context', '')}")
                if "search_query" in claim:
                    print(f"     Search Query: {claim.get('search_query', '')}")
            return claims
        else:
            print(f"❌ Failed to extract claims from LLM response. No JSON array found.")
            print(f"Full response content: {content}")
            return []
    except Exception as e:
        print(f"❌ Error extracting claims: {e}")
        traceback.print_exc()
        return []

def check_claim_with_google_factcheck(claim):
    try:
        print(f"🔍 Fact-checking with Google API: {claim}")
        url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
        params = {
            "key": GOOGLE_FACT_CHECK_API_KEY,
            "query": claim,
            "languageCode": "en"
        }
        
        print(f"📡 Sending request to Google Fact Check API: {url}")
        
        response = requests.get(url, params=params)
        
        print(f"📡 API response status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if "claims" in data and len(data["claims"]) > 0:
                print(f"✅ Found {len(data['claims'])} fact checks")
                return data
            else:
                print("❌ No fact checks found in API response")
                return {"claims": []}
        else:
            print(f"❌ API request failed: {response.status_code}")
            return {"claims": []}
    
    except Exception as e:
        print(f"❌ Error in Google Fact Check API: {e}")
        traceback.print_exc()
        return {"claims": []}

def search_with_serper(query):
    try:
        print(f"🔍 Searching with Serper API: {query}")
        url = "https://google.serper.dev/search"
        headers = {
            'X-API-KEY': SERPER_API_KEY,
            'Content-Type': 'application/json'
        }
        payload = {
            'q': query,
            'num': 8
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

def add_llama_context(claim, result, summary):
    try:
        print(f"🧠 Getting additional context from Llama for: {claim}")
        
        context_prompt = LLAMA_CONTEXT_PROMPT.replace("{{claim}}", claim).replace("{{result}}", result).replace("{{summary}}", summary)
        
        messages = [
            SystemMessage(content=context_prompt)
        ]
        
        response = llm.invoke(messages)
        context = response.content.strip()
        
        print(f"✅ Got additional context: {context[:100]}...")
        return context
    except Exception as e:
        print(f"❌ Error getting additional context: {e}")
        traceback.print_exc()
        return "Additional context could not be generated."

def verify_with_serper_and_llama(claim_data):
    try:
        if isinstance(claim_data, dict):
            claim = claim_data.get("claim", "")
            context = claim_data.get("context", "")
            search_query = claim_data.get("search_query", "")
        else:
            claim = claim_data
            context = ""
            search_query = ""
        
        print(f"🔍 Verifying claim with Serper + Llama: {claim}")
        if context:
            print(f"📝 Context: {context}")
        
        if not search_query:
            search_query = f"fact check {claim}"
        
        print(f"🔍 Using search query: {search_query}")
        
        search_results = search_with_serper(search_query)
        
        if not search_results or "organic" not in search_results or len(search_results["organic"]) == 0:
            print("❌ No search results found")
            result = {
                "claim": claim,
                "result": "UNVERIFIED",
                "summary": "Insufficient evidence available to verify this claim.",
                "detailed_analysis": "After extensive searching, no reliable sources were found to verify this specific claim. Without credible evidence, it's not possible to determine the accuracy of this statement.",
                "sources": []
            }
            
            additional_context = add_llama_context(claim, "UNVERIFIED", result["summary"])
            result["additional_context"] = additional_context
            
            return result
        
        formatted_results = json.dumps(search_results["organic"][:5], indent=2)
        
        verification_prompt = SERPER_VERIFICATION_PROMPT.replace("{{claim}}", claim).replace("{{search_results}}", formatted_results)
        
        if context:
            verification_prompt += f"\n\nAdditional Context: {context}"
        
        print(f"🤖 Sending to Llama 3.1 for search results analysis...")
        
        messages = [
            SystemMessage(content=verification_prompt)
        ]
        
        response = llm.invoke(messages)
        content = response.content
        
        print(f"🤖 Llama 3.1 analysis response: {content[:200]}...")
        
        try:
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            
            if start_idx >= 0 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                
                fixed_json_str = fix_broken_json(json_str)
                
                try:
                    result = json.loads(fixed_json_str)
                    print(f"✅ Serper verification result: {result.get('result', 'UNVERIFIED')}")
                    
                    if 'claim' not in result:
                        result['claim'] = claim
                    
                    if context:
                        result['context'] = context
                    
                    formatted_sources = []
                    if 'sources' in result and result['sources']:
                        for source in result['sources']:
                            if isinstance(source, dict) and 'name' in source and 'url' in source:
                                formatted_sources.append({
                                    'name': source['name'],
                                    'url': source['url']
                                })
                    
                    if formatted_sources:
                        result['sources'] = formatted_sources
                    else:
                        result['sources'] = []
                    
                    additional_context = add_llama_context(claim, result.get("result", "UNVERIFIED"), result.get("summary", ""))
                    result["additional_context"] = additional_context
                    
                    return result
                except json.JSONDecodeError as e:
                    print(f"❌ Error decoding fixed JSON: {e}")
                    print(f"Original JSON string: {json_str}")
                    print(f"Fixed JSON string: {fixed_json_str}")
                    raise ValueError(f"JSON decoding error after fix attempt: {e}")
            else:
                print("❌ JSON not found in response")
                raise ValueError("JSON not found in response")
        
        except (json.JSONDecodeError, ValueError) as e:
            print(f"❌ Error processing verification response: {e}")
            print(f"Full response: {content}")
            
            result = {
                "claim": claim,
                "result": "UNVERIFIED",
                "summary": "Technical issues prevented proper verification.",
                "detailed_analysis": "While search results were found, I was unable to process them correctly to determine the claim's accuracy. The information available was either insufficient or could not be properly analyzed.",
                "sources": []
            }
            
            additional_context = add_llama_context(claim, "UNVERIFIED", result["summary"])
            result["additional_context"] = additional_context
            
            return result
    
    except Exception as e:
        print(f"❌ Error in Serper verification: {e}")
        traceback.print_exc()
        
        result = {
            "claim": claim,
            "result": "UNVERIFIED",
            "summary": "Technical difficulties interrupted the verification process.",
            "detailed_analysis": f"An error occurred during the analysis of search results: {str(e)}. Without complete verification, the claim's accuracy cannot be determined.",
            "sources": []
        }
        
        additional_context = add_llama_context(claim, "UNVERIFIED", result["summary"])
        result["additional_context"] = additional_context
        
        return result

def verify_claim(claim_obj):
    if isinstance(claim_obj, dict):
        claim_text = claim_obj.get("claim", "")
        check_claim_with_google_factcheck(claim_text)
        
        verification = verify_with_serper_and_llama(claim_obj)
        
        verification["claim"] = claim_text
        
        if "context" in claim_obj and claim_obj["context"]:
            verification["original_context"] = claim_obj["context"]
        
        return verification
    else:
        check_claim_with_google_factcheck(claim_obj)
        return verify_with_serper_and_llama({"claim": claim_obj})

def generate_trust_score(claims):
    if not claims:
        return 5.0
    
    weights = {"TRUE": 10.0, "FALSE": 0.0, "UNVERIFIED": 5.0}
    total_weight = sum(weights.get(claim.get("result", "UNVERIFIED"), 5.0) for claim in claims)
    
    score = round(total_weight / len(claims), 1)
    print(f"📊 Generated trust score: {score}")
    return score

def get_recommendation(trust_score):
    if trust_score >= 8.0:
        return "This content appears highly reliable and factually accurate."
    elif trust_score >= 6.0:
        return "This content contains a mix of accurate and unverified information. Exercise some caution."
    elif trust_score >= 4.0:
        return "This content contains significant unverified information. Verify important claims with additional sources."
    else:
        return "This content contains multiple false or misleading claims. Approach with significant skepticism."

@app.route("/check", methods=["POST"])
def check_text():
    data = request.json
    
    if not data or 'text' not in data:
        return jsonify({
            "error": "Missing 'text' field in request"
        }), 400
    
    text = data['text']
    print(f"🔍 Received text to analyze: {text[:50]}...")
    
    if len(text.split()) < 20:
        print("📝 Text is short, analyzing as a single claim")
        single_claim = {
            "claim": text,
            "context": "User-provided statement for verification",
            "search_query": f"fact check {text}"
        }
        claims = [single_claim]
    else:
        claims = extract_claims(text)
    
    if not claims:
        return jsonify({
            "error": "Could not extract any verifiable claims from the text",
            "recommendation": "Try providing text with clear factual statements.",
            "text": text[:100] + "..." if len(text) > 100 else text
        }), 400
    
    verified_claims = []
    for claim_obj in claims:
        claim_text = claim_obj.get("claim", "")
        print(f"\n==== Verifying claim: {claim_text} ====")
        if "context" in claim_obj:
            print(f"📝 Context: {claim_obj.get('context', '')}")
        if "search_query" in claim_obj:
            print(f"🔍 Suggested search query: {claim_obj.get('search_query', '')}")
            
        verification = verify_claim(claim_obj)
        verified_claims.append(verification)
        print(f"==== Verification complete: {verification.get('result', 'UNVERIFIED')} ====\n")
    
    trust_score = generate_trust_score(verified_claims)
    
    response = {
        "verified_claims": verified_claims,
        "analysis_summary": {
            "total_claims": len(verified_claims),
            "verified_true": sum(1 for claim in verified_claims if claim.get("result") == "TRUE"),
            "verified_false": sum(1 for claim in verified_claims if claim.get("result") == "FALSE"),
            "unverified": sum(1 for claim in verified_claims if claim.get("result") == "UNVERIFIED"),
            "trust_score": trust_score,
            "recommendation": get_recommendation(trust_score),
            "original_text": text[:1000] + "..." if len(text) > 1000 else text
        }
    }
    
    for claim in response["verified_claims"]:
        source_links = []
        source_names = []
        
        if "sources" in claim and claim["sources"]:
            for source in claim["sources"]:
                if isinstance(source, dict):
                    if "name" in source and source["name"]:
                        source_names.append(source["name"])
                    if "url" in source and source["url"]:
                        source_links.append(source["url"])
        
        claim["source_names"] = source_names
        claim["source_links"] = source_links
    
    print(f"✅ Analysis complete, sending response")
    return jsonify(response)

@app.route("/check-single", methods=["POST"])
def check_single_claim():
    data = request.json
    
    if not data or 'claim' not in data:
        return jsonify({
            "error": "Missing 'claim' field in request"
        }), 400
    
    claim_text = data['claim']
    print(f"🔍 Checking single claim: {claim_text}")
    
    claim_obj = {
        "claim": claim_text,
        "context": "User-provided statement for verification",
        "search_query": f"fact check {claim_text}"
    }
    
    verification = verify_claim(claim_obj)
    
    source_links = []
    source_names = []
    
    if "sources" in verification and verification["sources"]:
        for source in verification["sources"]:
            if isinstance(source, dict):
                if "name" in source and source["name"]:
                    source_names.append(source["name"])
                if "url" in source and source["url"]:
                    source_links.append(source["url"])
    
    verification["source_names"] = source_names
    verification["source_links"] = source_links
    
    print(f"✅ Verification complete: {verification.get('result', 'UNVERIFIED')}")
    return jsonify(verification)

if __name__ == "__main__":
    print("🚀 Starting Text-Only Fact-Checking Server - http://localhost:5001/")
    print("Text Analysis: /check")
    print("Single Claim: /check-single")
    app.run(host="0.0.0.0", port=5002, debug=True)