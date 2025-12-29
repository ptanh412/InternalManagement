#!/usr/bin/env python3
"""
Simple Web Dashboard for ML Training Data
Run this to view data in your browser
"""

from datetime import datetime

import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st
from sqlalchemy import create_engine

# Configure Streamlit
st.set_page_config(
    page_title="ML Training Data Dashboard",
    page_icon="🤖",
    layout="wide"
)

@st.cache_data
def load_data():
    """Load data from PostgreSQL"""
    try:
        engine = create_engine(
            "postgresql://ml_user:ml_password@127.0.0.1:5433/ml_training_db"
        )

        query = """
        SELECT * FROM comprehensive_training_data 
        WHERE task_id IS NOT NULL 
        ORDER BY created_at DESC
        """

        df = pd.read_sql(query, engine)
        return df, None

    except Exception as e:
        return None, str(e)

def main():
    st.title("🤖 ML Training Data Dashboard")
    st.markdown("---")

    # Load data
    with st.spinner("Loading data from PostgreSQL..."):
        df, error = load_data()

    if error:
        st.error(f"❌ Error connecting to database: {error}")
        st.info("💡 Make sure PostgreSQL container is running on port 5433")
        return

    if df is None or len(df) == 0:
        st.warning("⚠️ No data found in database")
        return

    # Sidebar filters
    st.sidebar.header("🔧 Filters")

    # Priority filter
    priorities = ['All'] + list(df['priority'].dropna().unique())
    selected_priority = st.sidebar.selectbox("Priority", priorities)

    # Status filter
    statuses = ['All'] + list(df['task_status'].dropna().unique())
    selected_status = st.sidebar.selectbox("Status", statuses)

    # Apply filters
    filtered_df = df.copy()
    if selected_priority != 'All':
        filtered_df = filtered_df[filtered_df['priority'] == selected_priority]
    if selected_status != 'All':
        filtered_df = filtered_df[filtered_df['task_status'] == selected_status]

    # Main dashboard
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("📊 Total Records", f"{len(filtered_df):,}")

    with col2:
        unique_tasks = filtered_df['task_id'].nunique()
        st.metric("📝 Unique Tasks", unique_tasks)

    with col3:
        unique_users = filtered_df['user_id'].nunique()
        st.metric("👥 Unique Users", unique_users)

    with col4:
        avg_performance = filtered_df['performance_score'].mean()
        st.metric("⭐ Avg Performance", f"{avg_performance:.1f}" if not pd.isna(avg_performance) else "N/A")

    # Charts row 1
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("📊 Priority Distribution")
        priority_counts = filtered_df['priority'].value_counts()
        if not priority_counts.empty:
            fig = px.pie(
                values=priority_counts.values,
                names=priority_counts.index,
                title="Tasks by Priority"
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No priority data available")

    with col2:
        st.subheader("📈 Status Distribution")
        status_counts = filtered_df['task_status'].value_counts()
        if not status_counts.empty:
            fig = px.bar(
                x=status_counts.index,
                y=status_counts.values,
                title="Tasks by Status",
                labels={'x': 'Status', 'y': 'Count'}
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No status data available")

    # Charts row 2
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("⏰ Estimated Hours Distribution")
        if 'estimated_hours' in filtered_df.columns and filtered_df['estimated_hours'].notna().any():
            fig = px.histogram(
                filtered_df.dropna(subset=['estimated_hours']),
                x='estimated_hours',
                nbins=20,
                title="Distribution of Estimated Hours"
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No estimated hours data available")

    with col2:
        st.subheader("⭐ Performance Score Distribution")
        if 'performance_score' in filtered_df.columns and filtered_df['performance_score'].notna().any():
            fig = px.histogram(
                filtered_df.dropna(subset=['performance_score']),
                x='performance_score',
                nbins=20,
                title="Distribution of Performance Scores"
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No performance score data available")

    # Data over time
    st.subheader("📅 Data Collection Timeline")
    if 'created_at' in filtered_df.columns:
        daily_counts = filtered_df.groupby(filtered_df['created_at'].dt.date).size()
        if not daily_counts.empty:
            fig = px.line(
                x=daily_counts.index,
                y=daily_counts.values,
                title="Records Added Per Day",
                labels={'x': 'Date', 'y': 'Records Added'}
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No timeline data available")

    # Data table
    st.subheader("📋 Raw Data")

    # Column selection
    all_columns = list(filtered_df.columns)
    display_columns = st.multiselect(
        "Select columns to display:",
        all_columns,
        default=['task_id', 'task_title', 'task_status', 'priority', 'estimated_hours', 'performance_score', 'created_at'][:min(7, len(all_columns))]
    )

    if display_columns:
        # Show data with pagination
        items_per_page = st.selectbox("Items per page:", [10, 25, 50, 100], index=1)

        total_pages = (len(filtered_df) - 1) // items_per_page + 1
        page = st.number_input("Page:", min_value=1, max_value=total_pages, value=1)

        start_idx = (page - 1) * items_per_page
        end_idx = start_idx + items_per_page

        page_data = filtered_df[display_columns].iloc[start_idx:end_idx]
        st.dataframe(page_data, use_container_width=True)

        # Download button
        csv = filtered_df[display_columns].to_csv(index=False)
        st.download_button(
            label="📥 Download Filtered Data as CSV",
            data=csv,
            file_name=f"ml_training_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime='text/csv'
        )

    # Summary statistics
    st.subheader("📊 Summary Statistics")

    numeric_columns = filtered_df.select_dtypes(include=[np.number]).columns
    if len(numeric_columns) > 0:
        st.dataframe(filtered_df[numeric_columns].describe(), use_container_width=True)
    else:
        st.info("No numeric columns for statistics")

if __name__ == "__main__":
    main()
