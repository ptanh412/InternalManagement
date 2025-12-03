#!/usr/bin/env python3
"""
PostgreSQL ML Data Viewer
Easy-to-use script to view ML training data in PostgreSQL
"""

import pandas as pd
import numpy as np
from sqlalchemy import create_engine
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class MLDataViewer:
    def __init__(self):
        """Initialize connection to PostgreSQL"""
        self.engine = create_engine(
            "postgresql://ml_user:ml_password@127.0.0.1:5433/ml_training_db"
        )

    def get_summary(self):
        """Get a comprehensive summary of the ML data"""
        print("="*60)
        print("🔍 ML TRAINING DATA SUMMARY")
        print("="*60)

        # Basic counts
        query = """
        SELECT 
            COUNT(*) as total_records,
            COUNT(DISTINCT task_id) as unique_tasks,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(DISTINCT project_id) as unique_projects,
            AVG(estimated_hours) as avg_estimated_hours,
            AVG(performance_score) as avg_performance_score,
            MIN(created_at) as earliest_record,
            MAX(created_at) as latest_record
        FROM comprehensive_training_data
        WHERE task_id IS NOT NULL;
        """

        summary = pd.read_sql(query, self.engine)

        for _, row in summary.iterrows():
            print(f"📊 Total Records: {row['total_records']:,}")
            print(f"📝 Unique Tasks: {row['unique_tasks']}")
            print(f"👥 Unique Users: {row['unique_users']}")
            print(f"📂 Unique Projects: {row['unique_projects']}")
            print(f"⏰ Avg Estimated Hours: {row['avg_estimated_hours']:.1f}")
            print(f"⭐ Avg Performance Score: {row['avg_performance_score']:.1f}")
            print(f"📅 Data Range: {row['earliest_record']} to {row['latest_record']}")

        print()

    def get_priority_breakdown(self):
        """Show breakdown by task priority"""
        print("📊 TASK PRIORITY BREAKDOWN")
        print("-" * 40)

        query = """
        SELECT 
            priority,
            COUNT(*) as count,
            ROUND(CAST(AVG(estimated_hours) AS NUMERIC), 1) as avg_hours,
            ROUND(CAST(AVG(performance_score) AS NUMERIC), 1) as avg_performance
        FROM comprehensive_training_data 
        WHERE priority IS NOT NULL 
        GROUP BY priority 
        ORDER BY count DESC;
        """

        df = pd.read_sql(query, self.engine)
        print(df.to_string(index=False))
        print()

    def get_status_breakdown(self):
        """Show breakdown by task status"""
        print("📈 TASK STATUS BREAKDOWN")
        print("-" * 40)

        query = """
        SELECT 
            task_status,
            COUNT(*) as count,
            ROUND(CAST(AVG(estimated_hours) AS NUMERIC), 1) as avg_hours,
            ROUND(CAST(AVG(performance_score) AS NUMERIC), 1) as avg_performance
        FROM comprehensive_training_data 
        WHERE task_status IS NOT NULL 
        GROUP BY task_status 
        ORDER BY count DESC;
        """

        df = pd.read_sql(query, self.engine)
        print(df.to_string(index=False))
        print()

    def get_recent_tasks(self, limit=10):
        """Show most recent tasks"""
        print(f"🕒 MOST RECENT {limit} TASKS")
        print("-" * 80)

        query = f"""
        SELECT 
            task_title,
            task_status,
            priority,
            estimated_hours,
            performance_score,
            DATE(created_at) as date_added
        FROM comprehensive_training_data 
        WHERE task_title IS NOT NULL
        ORDER BY created_at DESC 
        LIMIT {limit};
        """

        df = pd.read_sql(query, self.engine)
        print(df.to_string(index=False))
        print()

    def get_user_performance(self):
        """Show user performance statistics"""
        print("👤 USER PERFORMANCE STATISTICS")
        print("-" * 50)

        query = """
        SELECT 
            user_id,
            COUNT(*) as task_count,
            ROUND(CAST(AVG(estimated_hours) AS NUMERIC), 1) as avg_task_hours,
            ROUND(CAST(AVG(performance_score) AS NUMERIC), 1) as avg_performance,
            COUNT(CASE WHEN task_status = 'DONE' THEN 1 END) as completed_tasks
        FROM comprehensive_training_data 
        WHERE user_id IS NOT NULL AND performance_score IS NOT NULL
        GROUP BY user_id 
        ORDER BY avg_performance DESC;
        """

        df = pd.read_sql(query, self.engine)
        print(df.to_string(index=False))
        print()

    def search_tasks(self, keyword):
        """Search for tasks containing a keyword"""
        print(f"🔍 TASKS CONTAINING '{keyword.upper()}'")
        print("-" * 60)

        query = """
        SELECT 
            task_title,
            task_status,
            priority,
            estimated_hours,
            performance_score
        FROM comprehensive_training_data 
        WHERE UPPER(task_title) LIKE %s OR UPPER(task_description) LIKE %s
        ORDER BY created_at DESC
        LIMIT 20;
        """

        search_term = f"%{keyword.upper()}%"
        df = pd.read_sql(query, self.engine, params=[search_term, search_term])

        if len(df) > 0:
            print(df.to_string(index=False))
        else:
            print("No tasks found matching your search.")
        print()

    def export_to_csv(self, filename="ml_training_data.csv"):
        """Export all data to CSV"""
        print(f"💾 EXPORTING DATA TO {filename}")
        print("-" * 40)

        query = "SELECT * FROM comprehensive_training_data ORDER BY created_at DESC;"
        df = pd.read_sql(query, self.engine)
        df.to_csv(filename, index=False)
        print(f"✅ Exported {len(df)} records to {filename}")
        print()

    def run_interactive_menu(self):
        """Run interactive menu for data exploration"""
        while True:
            print("\n" + "="*60)
            print("🎯 ML DATA VIEWER - INTERACTIVE MENU")
            print("="*60)
            print("1. 📊 Data Summary")
            print("2. 📈 Priority Breakdown")
            print("3. 📋 Status Breakdown")
            print("4. 🕒 Recent Tasks")
            print("5. 👤 User Performance")
            print("6. 🔍 Search Tasks")
            print("7. 💾 Export to CSV")
            print("8. 🚪 Exit")
            print("-" * 60)

            choice = input("Enter your choice (1-8): ").strip()

            try:
                if choice == '1':
                    self.get_summary()
                elif choice == '2':
                    self.get_priority_breakdown()
                elif choice == '3':
                    self.get_status_breakdown()
                elif choice == '4':
                    limit = input("How many recent tasks to show? (default 10): ").strip()
                    limit = int(limit) if limit.isdigit() else 10
                    self.get_recent_tasks(limit)
                elif choice == '5':
                    self.get_user_performance()
                elif choice == '6':
                    keyword = input("Enter search keyword: ").strip()
                    if keyword:
                        self.search_tasks(keyword)
                elif choice == '7':
                    filename = input("Enter filename (default: ml_training_data.csv): ").strip()
                    filename = filename if filename else "ml_training_data.csv"
                    self.export_to_csv(filename)
                elif choice == '8':
                    print("👋 Goodbye!")
                    break
                else:
                    print("❌ Invalid choice. Please enter 1-8.")

            except Exception as e:
                print(f"❌ Error: {e}")

            input("\nPress Enter to continue...")

def main():
    """Main function to run the data viewer"""
    try:
        viewer = MLDataViewer()

        # Quick overview
        viewer.get_summary()
        viewer.get_priority_breakdown()
        viewer.get_recent_tasks(5)

        # Ask if user wants interactive mode
        print("🤔 Would you like to explore the data interactively?")
        response = input("Enter 'y' for interactive mode, or any key to exit: ").strip().lower()

        if response == 'y':
            viewer.run_interactive_menu()
        else:
            print("👋 Thanks for using ML Data Viewer!")

    except Exception as e:
        print(f"❌ Connection Error: {e}")
        print("💡 Make sure PostgreSQL container is running and accessible")

if __name__ == "__main__":
    main()
