#!/bin/bash

# Script to add dark mode classes to components
# This script demonstrates the pattern - you'll need to run similar replacements for all components

echo "🌙 Adding dark mode support to components..."

# Common patterns to replace:
# bg-white -> bg-white dark:bg-gray-800
# bg-gray-50 -> bg-gray-50 dark:bg-gray-900
# text-gray-900 -> text-gray-900 dark:text-gray-100
# text-gray-600 -> text-gray-600 dark:text-gray-300
# text-gray-500 -> text-gray-500 dark:text-gray-400
# border-gray-200 -> border-gray-200 dark:border-gray-700
# border-gray-100 -> border-gray-100 dark:border-gray-700

# Example for one file (you'll need to do this for all files):
# sed -i '' 's/className="bg-white /className="bg-white dark:bg-gray-800 /g' src/pages/dashboards/EmployeeDashboard.js

echo "⚠️  This is a template script. You need to:"
echo "1. Backup your files first"
echo "2. Run find-replace operations carefully"
echo "3. Test each component after changes"
echo ""
echo "Common replacements needed:"
echo "  bg-white          → bg-white dark:bg-gray-800"
echo "  bg-gray-50        → bg-gray-50 dark:bg-gray-900"
echo "  text-gray-900     → text-gray-900 dark:text-gray-100"
echo "  text-gray-600     → text-gray-600 dark:text-gray-300"
echo "  text-gray-500     → text-gray-500 dark:text-gray-400"
echo "  border-gray-200   → border-gray-200 dark:border-gray-700"
echo "  border-gray-100   → border-gray-100 dark:border-gray-700"
echo "  shadow-lg         → shadow-lg dark:shadow-gray-900/50"

echo ""
echo "Use VS Code find-replace with regex for best results!"
