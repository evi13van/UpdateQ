import sys
from typing import Dict, Any
import httpx
from anthropic import Anthropic

class ConnectionMonitor:
    """Monitor HTTP connection pools and client states"""
    
    def __init__(self):
        self.active_clients = {
            "httpx": 0,
            "anthropic": 0,
            "firecrawl": 0
        }
    
    def log_client_created(self, client_type: str, context: str = ""):
        """Log when a new client is created"""
        self.active_clients[client_type] = self.active_clients.get(client_type, 0) + 1
        print(
            f"[CONNECTION] {client_type.upper()} client created | "
            f"Active: {self.active_clients[client_type]} | Context: {context}",
            file=sys.stderr
        )
    
    def log_client_closed(self, client_type: str, context: str = ""):
        """Log when a client is closed"""
        self.active_clients[client_type] = max(0, self.active_clients.get(client_type, 0) - 1)
        print(
            f"[CONNECTION] {client_type.upper()} client closed | "
            f"Active: {self.active_clients[client_type]} | Context: {context}",
            file=sys.stderr
        )
    
    def get_active_connections(self) -> Dict[str, int]:
        """Get count of active connections by type"""
        return self.active_clients.copy()
    
    def log_connection_summary(self):
        """Log summary of all active connections"""
        total = sum(self.active_clients.values())
        print(f"[CONNECTION] Active connections summary:", file=sys.stderr)
        for client_type, count in self.active_clients.items():
            print(f"[CONNECTION]   {client_type}: {count}", file=sys.stderr)
        print(f"[CONNECTION]   TOTAL: {total}", file=sys.stderr)
        
        if total > 10:
            print(
                f"[CONNECTION] ⚠️ WARNING: High number of active connections ({total})",
                file=sys.stderr
            )
    
    def check_httpx_pool_state(self, client: httpx.AsyncClient) -> Dict[str, Any]:
        """Check the state of an httpx client's connection pool"""
        try:
            # Access internal connection pool stats if available
            pool_info = {}
            if hasattr(client, '_transport'):
                transport = client._transport
                if hasattr(transport, '_pool'):
                    pool = transport._pool
                    pool_info = {
                        "connections": len(pool._connections) if hasattr(pool, '_connections') else 0,
                        "requests_in_flight": len(pool._requests) if hasattr(pool, '_requests') else 0
                    }
            return pool_info
        except Exception as e:
            print(f"[CONNECTION] Error checking httpx pool state: {e}", file=sys.stderr)
            return {}


# Global instance
connection_monitor = ConnectionMonitor()