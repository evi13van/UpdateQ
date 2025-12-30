#!/usr/bin/env python3
"""Inspect Firecrawl library to verify correct parameter names"""

import sys
import inspect

try:
    from firecrawl import FirecrawlApp
    
    print("="*60)
    print("FirecrawlApp Class Information")
    print("="*60)
    print(f"\nClass: {FirecrawlApp}")
    print(f"Class name: {FirecrawlApp.__name__}")
    
    print("\nAvailable methods and attributes:")
    for item in dir(FirecrawlApp):
        if not item.startswith('_'):
            attr = getattr(FirecrawlApp, item)
            attr_type = type(attr).__name__
            print(f"  - {item} ({attr_type})")
    
    # Try to instantiate and check instance methods
    print("\n" + "="*60)
    print("Checking instance methods (requires API key)")
    print("="*60)
    
    try:
        # Try to create instance without API key to see what methods exist
        print("\nAttempting to inspect instance methods...")
        instance_methods = [m for m in dir(FirecrawlApp) if callable(getattr(FirecrawlApp, m)) and not m.startswith('_')]
        print(f"Callable methods: {instance_methods}")
        
        # Check each method signature
        for method_name in instance_methods:
            try:
                method = getattr(FirecrawlApp, method_name)
                sig = inspect.signature(method)
                print(f"\n{method_name}{sig}")
                
                # Get first few lines of source if available
                try:
                    source = inspect.getsource(method)
                    lines = source.split('\n')[:10]
                    for line in lines:
                        print(f"  {line}")
                except:
                    pass
            except Exception as e:
                print(f"\n{method_name}: Could not inspect - {e}")
                
    except Exception as e:
        print(f"Error inspecting instance: {e}")
            
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)