// Navigation constants for role-based menu items
import {
  HomeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  UserIcon,
  ChatBubbleBottomCenterTextIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ClockIcon,
  UsersIcon,
  FolderIcon,
  BeakerIcon,
  ChartPieIcon,
  ArrowUpTrayIcon,
  NewspaperIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';

export const NAVIGATION_ITEMS = {
  ADMIN: [
    {
      name: 'Dashboard',
      href: '/dashboard/admin',
      icon: HomeIcon,
      current: false,
      description: 'Admin overview and analytics'
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: UsersIcon,
      current: false,
      description: 'Manage users and permissions'
    },
    {
      name: 'CV Analysis',
      href: '/admin/cv-analysis',
      icon: DocumentTextIcon,
      current: false,
      description: 'AI-powered CV analysis'
    },
    {
      name: 'Roles & Departments',
      href: '/admin/roles-departments',
      icon: BuildingOfficeIcon,
      current: false,
      description: 'Manage organizational structure'
    },
    {
      name: 'Posts',
      href: '/posts',
      icon: NewspaperIcon,
      current: false,
      description: 'Social feed and announcements'
    },
    {
      name: 'Chat',
      href: '/admin/chat',
      icon: ChatBubbleBottomCenterTextIcon,
      current: false,
      description: 'Admin communication hub'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: CogIcon,
      current: false,
      description: 'System configuration'
    }
  ],
  
  PROJECT_MANAGER: [
    {
      name: 'Dashboard',
      href: '/dashboard/project-manager',
      icon: HomeIcon,
      current: false,
      description: 'Project overview and metrics'
    },
    {
      name: 'Projects',
      href: '/project-manager/projects',
      icon: FolderIcon,
      current: false,
      description: 'Manage all projects'
    },
    // {
    //   name: 'Team Management',
    //   href: '/project-manager/team',
    //   icon: UserGroupIcon,
    //   current: false,
    //   description: 'Manage project teams'
    // },
    {
      name: 'Resource Dashboard',
      href: '/project-manager/resources',
      icon: ChartPieIcon,
      current: false,
      description: 'View team workload and resources'
    },
    {
      name: 'Posts',
      href: '/posts',
      icon: NewspaperIcon,
      current: false,
      description: 'Team feed and updates'
    },
    {
      name: 'Chat',
      href: '/project-manager/chat',
      icon: ChatBubbleBottomCenterTextIcon,
      current: false,
      description: 'Team communication'
    },
    {
      name: 'Meetings',
      href: '/project-manager/meetings',
      icon: VideoCameraIcon,
      current: false,
      description: 'Video meetings and conferences'
    }
  ],
  
  TEAM_LEAD: [
    {
      name: 'Dashboard',
      href: '/dashboard/team-lead',
      icon: HomeIcon,
      current: false,
      description: 'Team lead overview'
    },
    {
      name: 'Projects',
      href: '/team-lead/projects',
      icon: FolderIcon,
      current: false,
      description: 'Your assigned projects'
    },
    {
      name: 'My Tasks',
      href: '/team-lead/tasks',
      icon: ClipboardDocumentListIcon,
      current: false,
      description: 'View and manage your tasks'
    },
    {
      name: 'Team Management',
      href: '/team-lead/team',
      icon: UserGroupIcon,
      current: false,
      description: 'Manage your team'
    },
    {
      name: 'Workload Dashboard',
      href: '/team-lead/personal-productivity',
      icon: BeakerIcon,
      current: false,
      description: 'Monitor team workload'
    },
    {
      name: 'Team Resources',
      href: '/team-lead/resources',
      icon: ChartBarIcon,
      current: false,
      description: 'Team workload and performance'
    },
    {
      name: 'Task Extensions',
      href: '/team-lead/extensions',
      icon: ClockIcon,
      current: false,
      description: 'Manage extension requests'
    },
    {
      name: 'Task Submissions',
      href: '/team-lead/submissions',
      icon: ArrowUpTrayIcon,
      current: false,
      description: 'Submit completed work'
    },
    {
      name: 'Posts',
      href: '/posts',
      icon: NewspaperIcon,
      current: false,
      description: 'Team feed and updates'
    },
    {
      name: 'Chat',
      href: '/team-lead/chat',
      icon: ChatBubbleBottomCenterTextIcon,
      current: false,
      description: 'Team communication'
    },
    {
      name: 'Meetings',
      href: '/team-lead/meetings',
      icon: VideoCameraIcon,
      current: false,
      description: 'Video meetings and conferences'
    }
  ],
  
  EMPLOYEE: [
    {
      name: 'Dashboard',
      href: '/dashboard/employee',
      icon: HomeIcon,
      current: false,
      description: 'Your personal dashboard'
    },
    {
      name: 'My Tasks',
      href: '/employee/tasks',
      icon: ClipboardDocumentListIcon,
      current: false,
      description: 'View and manage your tasks'
    },
    {
      name: 'Workload Dashboard',
      href: '/employee/personal-productivity',
      icon: BeakerIcon,
      current: false,
      description: 'Monitor team workload'
    },
    {
      name: 'Task Submissions',
      href: '/employee/submissions',
      icon: ArrowUpTrayIcon,
      current: false,
      description: 'Submit completed work'
    },
    {
      name: 'Posts',
      href: '/posts',
      icon: NewspaperIcon,
      current: false,
      description: 'Company feed and updates'
    },
    {
      name: 'Chat',
      href: '/employee/chat',
      icon: ChatBubbleBottomCenterTextIcon,
      current: false,
      description: 'Team communication'
    }
  ],
  
  // Default navigation for users without specific roles
  DEFAULT: [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      current: false,
      description: 'Your dashboard'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserIcon,
      current: false,
      description: 'Manage your profile'
    }
  ]
};

export const ROLE_COLORS = {
  ADMIN: 'bg-red-100 text-red-800',
  PROJECT_MANAGER: 'bg-blue-100 text-blue-800',
  TEAM_LEAD: 'bg-green-100 text-green-800',
  EMPLOYEE: 'bg-gray-100 text-gray-800',
  DEFAULT: 'bg-gray-100 text-gray-800'
};

export const getNavigationForRole = (role) => {
  return NAVIGATION_ITEMS[role] || NAVIGATION_ITEMS.DEFAULT;
};

export const getRoleColor = (role) => {
  return ROLE_COLORS[role] || ROLE_COLORS.DEFAULT;
};