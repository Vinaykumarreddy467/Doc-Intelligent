#!/bin/bash
# DocuIntell Startup Script - Run with screen for persistence

echo "Starting DocuIntell..."

# Kill existing screens
screen -dmS ollama ollama serve 2>/dev/null
sleep 3

screen -dmS ai bash -c "cd docuintell/ai-service && source venv/bin/activate && python main.py" 2>/dev/null
sleep 4

screen -dmS backend bash -c "cd docuintell/backend && mvn spring-boot:run" 2>/dev/null
sleep 18

screen -dmS frontend bash -c "cd docuintell/frontend && python3 -m http.server 8081" 2>/dev/null
sleep 2

echo ""
echo "=== Services Started ==="
screen -ls
echo ""
echo "Access: http://localhost:8081"
echo "Backend: http://localhost:8080"
echo "AI:     http://localhost:8000/health"
echo ""
echo "View logs: screen -r ollama (Ctrl+A,D to detach)"