"""Email Reading Service"""
import imaplib
import email
from email.header import decode_header
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

def fetch_emails(host: str, port: int, username: str, password: str, limit: int = 10) -> List[Dict]:
    """Fetch emails from IMAP server"""
    emails_list = []
    
    try:
        mail = imaplib.IMAP4_SSL(host, port)
        mail.login(username, password)
        mail.select("inbox")
        
        status, messages = mail.search(None, "ALL")
        if status != "OK":
            return emails_list
        
        mail_ids = messages[0].split()
        for i in range(len(mail_ids) - 1, max(len(mail_ids) - limit - 1, -1), -1):
            status, msg_data = mail.fetch(mail_ids[i], "(RFC822)")
            if status != "OK":
                continue
            
            msg = email.message_from_bytes(msg_data[0][1])
            subject = ""
            if msg["Subject"]:
                subject_parts = decode_header(msg["Subject"])
                subject = " ".join([
                    part.decode(encoding or "utf-8") if isinstance(part, bytes) else part
                    for part, encoding in subject_parts
                ])
            
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                        break
            else:
                body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")
            
            emails_list.append({
                "subject": subject,
                "from": msg.get("From", ""),
                "date": msg.get("Date", ""),
                "body": body[:2000]
            })
        
        mail.logout()
    except Exception as e:
        logger.error(f"Email fetch error: {e}")
    
    return emails_list
