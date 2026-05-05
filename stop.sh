#!/bin/bash
# DocuIntell Stop Script

echo "Stopping DocuIntell..."
screen -S ollama -X quit 2>/dev/null
screen -S ai -X quit 2>/dev/null
screen -S backend -X quit 2>/dev/null  
screen -S frontend -X quit 2>/dev/null
sleep 2
screen -wipe 2>/dev/null
echo "Stopped"