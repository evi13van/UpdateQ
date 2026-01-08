import psutil
import os
import sys
from datetime import datetime
import tracemalloc

class MemoryMonitor:
    """Utility for monitoring memory usage and detecting leaks"""
    
    def __init__(self):
        self.process = psutil.Process(os.getpid())
        self.tracemalloc_started = False
    
    def get_memory_info(self) -> dict:
        """Get current memory usage information"""
        try:
            mem_info = self.process.memory_info()
            return {
                "rss_mb": mem_info.rss / 1024 / 1024,  # Resident Set Size in MB
                "vms_mb": mem_info.vms / 1024 / 1024,  # Virtual Memory Size in MB
                "percent": self.process.memory_percent(),
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"[MEMORY] Error getting memory info: {e}", file=sys.stderr)
            return {}
    
    def log_memory(self, context: str = ""):
        """Log current memory usage with context"""
        mem = self.get_memory_info()
        if mem:
            print(
                f"[MEMORY] {context} | RSS: {mem['rss_mb']:.2f}MB | "
                f"VMS: {mem['vms_mb']:.2f}MB | Percent: {mem['percent']:.2f}%",
                file=sys.stderr
            )
    
    def start_tracemalloc(self):
        """Start memory allocation tracking"""
        if not self.tracemalloc_started:
            tracemalloc.start()
            self.tracemalloc_started = True
            print("[MEMORY] Tracemalloc started", file=sys.stderr)
    
    def get_top_allocations(self, limit: int = 10):
        """Get top memory allocations"""
        if not self.tracemalloc_started:
            return []
        
        snapshot = tracemalloc.take_snapshot()
        top_stats = snapshot.statistics('lineno')
        
        allocations = []
        for stat in top_stats[:limit]:
            allocations.append({
                "file": stat.traceback.format()[0] if stat.traceback else "unknown",
                "size_mb": stat.size / 1024 / 1024,
                "count": stat.count
            })
        
        return allocations
    
    def log_top_allocations(self, context: str = "", limit: int = 5):
        """Log top memory allocations"""
        allocations = self.get_top_allocations(limit)
        if allocations:
            print(f"[MEMORY] Top {limit} allocations for {context}:", file=sys.stderr)
            for i, alloc in enumerate(allocations, 1):
                print(
                    f"[MEMORY]   {i}. {alloc['size_mb']:.2f}MB - {alloc['count']} objects - {alloc['file']}",
                    file=sys.stderr
                )
    
    def check_memory_threshold(self, threshold_mb: float = 500) -> bool:
        """Check if memory usage exceeds threshold"""
        mem = self.get_memory_info()
        if mem and mem['rss_mb'] > threshold_mb:
            print(
                f"[MEMORY] ⚠️ WARNING: Memory usage ({mem['rss_mb']:.2f}MB) "
                f"exceeds threshold ({threshold_mb}MB)",
                file=sys.stderr
            )
            return True
        return False


# Global instance
memory_monitor = MemoryMonitor()