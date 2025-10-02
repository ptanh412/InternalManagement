import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import AdminIdentityManager from '../AdminIdentityManager';
import aiService from '../../../services/aiService';
import adminUserService from '../../../services/adminUserService';

// Mock services
jest.mock('../../../services/aiService');
jest.mock('../../../services/adminUserService');
jest.mock('../../../services/roleService');
jest.mock('../../../services/departmentService');

const mockCVParsingResult = {
  result: {
    fileName: 'test_resume.pdf',
    processingStatus: 'SUCCESS',
    confidenceScore: 0.85,
    processingTimeMs: 1250,
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+1-555-123-4567',
      address: '123 Main St, Anytown, ST 12345',
      city: 'Anytown',
      linkedinProfile: 'https://linkedin.com/in/johndoe',
      githubProfile: 'https://github.com/johndoe'
    },
    professionalInfo: {
      currentPosition: 'Senior Software Engineer',
      currentCompany: 'Tech Corp',
      department: 'Engineering',
      seniorityLevel: 'Senior',
      totalYearsExperience: 5,
      professionalSummary: 'Experienced software engineer with expertise in full-stack development.',
      certifications: ['AWS Certified Developer', 'Scrum Master'],
      languages: ['English', 'Spanish']
    },
    skills: [
      {
        skillName: 'JavaScript',
        category: 'Technical',
        proficiencyLevel: 0.9,
        yearsOfExperience: 5,
        isPrimary: true
      },
      {
        skillName: 'React',
        category: 'Framework',
        proficiencyLevel: 0.85,
        yearsOfExperience: 3,
        isPrimary: true
      },
      {
        skillName: 'Node.js',
        category: 'Backend',
        proficiencyLevel: 0.8,
        yearsOfExperience: 4,
        isPrimary: false
      }
    ],
    workExperience: [
      {
        position: 'Senior Software Engineer',
        company: 'Tech Corp',
        startDate: '2021-01-01',
        endDate: null,
        description: 'Lead development of web applications using React and Node.js',
        achievements: [
          'Increased application performance by 40%',
          'Led team of 4 developers'
        ],
        technologies: ['React', 'Node.js', 'AWS', 'MongoDB']
      },
      {
        position: 'Software Engineer',
        company: 'Previous Corp',
        startDate: '2019-01-01',
        endDate: '2020-12-31',
        description: 'Developed and maintained web applications',
        achievements: [
          'Implemented new features that increased user engagement by 25%'
        ],
        technologies: ['JavaScript', 'Python', 'PostgreSQL']
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University of Technology',
        fieldOfStudy: 'Computer Science',
        graduationDate: '2018-05-15',
        grade: '3.8 GPA',
        relevantCourses: ['Data Structures', 'Algorithms', 'Web Development']
      }
    ]
  }
};

const mockUsers = [
  {
    id: 1,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    username: 'admin',
    active: true,
    roles: [{ name: 'ADMIN' }],
    profile: {
      department: { name: 'IT' },
      position: { title: 'Administrator' }
    }
  }
];

const mockDepartments = [
  { id: 1, name: 'Engineering', description: 'Software Development' },
  { id: 2, name: 'IT', description: 'Information Technology' }
];

const mockPositions = [
  { id: 1, title: 'Software Engineer', departmentId: 1 },
  { id: 2, title: 'Senior Software Engineer', departmentId: 1 }
];

const mockRoles = [
  { id: 1, name: 'USER', description: 'Standard User' },
  { id: 2, name: 'ADMIN', description: 'Administrator' }
];

describe('AdminIdentityManager CV Integration', () => {
  const mockShowNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock service methods
    adminUserService.getAllUsers.mockResolvedValue(mockUsers);
    adminUserService.createUser.mockResolvedValue({ id: 3, ...mockUsers[0] });
    
    aiService.parseCVForUserCreation.mockResolvedValue(mockCVParsingResult);
    aiService.transformCVToUserForm.mockReturnValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'john.doe'
    });
    aiService.suggestDepartment.mockResolvedValue('Engineering');
    aiService.suggestPosition.mockResolvedValue('Software Engineer');
    aiService.suggestRoles.mockResolvedValue(['USER']);
    aiService.formatCVConfidence.mockReturnValue('85%');
    aiService.getCVParsingStatus.mockReturnValue({
      label: 'SUCCESS',
      color: 'success',
      description: 'CV processed successfully'
    });
    aiService.validateCVFile.mockReturnValue({ isValid: true });
  });

  test('should render CV upload button in add user dialog', async () => {
    render(<AdminIdentityManager showNotification={mockShowNotification} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add User')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add User'));
    
    await waitFor(() => {
      expect(screen.getByText('Upload CV')).toBeInTheDocument();
    });
  });

  test('should handle CV file upload and parsing', async () => {
    render(<AdminIdentityManager showNotification={mockShowNotification} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add User')).toBeInTheDocument();
    });

    // Open add user dialog
    fireEvent.click(screen.getByText('Add User'));
    
    await waitFor(() => {
      expect(screen.getByText('Upload CV')).toBeInTheDocument();
    });

    // Click CV upload button
    fireEvent.click(screen.getByText('Upload CV'));
    
    // Mock file upload
    const file = new File(['test cv content'], 'resume.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/upload cv file/i);
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    // Click parse button
    const parseButton = screen.getByText('Parse CV');
    fireEvent.click(parseButton);
    
    // Verify CV parsing service was called
    await waitFor(() => {
      expect(aiService.parseCVForUserCreation).toHaveBeenCalledWith(file, expect.any(Object));
    });
    
    // Verify notification was shown
    expect(mockShowNotification).toHaveBeenCalledWith(
      'CV parsed successfully! Review the extracted data.',
      'success'
    );
  });

  test('should open CV data preview dialog after successful parsing', async () => {
    render(<AdminIdentityManager showNotification={mockShowNotification} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add User')).toBeInTheDocument();
    });

    // Simulate CV parsing flow
    fireEvent.click(screen.getByText('Add User'));
    fireEvent.click(screen.getByText('Upload CV'));
    
    const file = new File(['test cv content'], 'resume.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/upload cv file/i);
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    fireEvent.click(screen.getByText('Parse CV'));
    
    // Wait for CV data preview dialog
    await waitFor(() => {
      expect(screen.getByText('CV Parsing Results')).toBeInTheDocument();
      expect(screen.getByText('John')).toBeInTheDocument(); // First name from CV
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument(); // Email from CV
    });
  });

  test('should handle CV data acceptance and field mapping', async () => {
    render(<AdminIdentityManager showNotification={mockShowNotification} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add User')).toBeInTheDocument();
    });

    // Simulate CV parsing and preview
    fireEvent.click(screen.getByText('Add User'));
    fireEvent.click(screen.getByText('Upload CV'));
    
    const file = new File(['test cv content'], 'resume.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/upload cv file/i);
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    fireEvent.click(screen.getByText('Parse CV'));
    
    // Accept CV data
    await waitFor(() => {
      expect(screen.getByText('Use This Data')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Use This Data'));
    
    // Verify field mapping dialog opens
    await waitFor(() => {
      expect(screen.getByText('Map CV Data to User Profile')).toBeInTheDocument();
    });
  });

  test('should apply CV mapping and auto-fill form', async () => {
    render(<AdminIdentityManager showNotification={mockShowNotification} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add User')).toBeInTheDocument();
    });

    // Complete CV parsing workflow
    fireEvent.click(screen.getByText('Add User'));
    fireEvent.click(screen.getByText('Upload CV'));
    
    const file = new File(['test cv content'], 'resume.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/upload cv file/i);
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    fireEvent.click(screen.getByText('Parse CV'));
    
    // Accept and map CV data
    await waitFor(() => {
      fireEvent.click(screen.getByText('Use This Data'));
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Apply Mapping'));
    });
    
    // Verify success notification
    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'CV data mapped successfully! Form has been auto-filled.',
        'success'
      );
    });
  });

  test('should handle CV data rejection', async () => {
    render(<AdminIdentityManager showNotification={mockShowNotification} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add User')).toBeInTheDocument();
    });

    // Simulate CV parsing
    fireEvent.click(screen.getByText('Add User'));
    fireEvent.click(screen.getByText('Upload CV'));
    
    const file = new File(['test cv content'], 'resume.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/upload cv file/i);
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    fireEvent.click(screen.getByText('Parse CV'));
    
    // Reject CV data
    await waitFor(() => {
      expect(screen.getByText('Reject Data')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Reject Data'));
    
    // Verify rejection notification
    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'CV data rejected. You can upload a different CV or create user manually.',
        'info'
      );
    });
  });

  test('should handle CV parsing errors gracefully', async () => {
    // Mock parsing failure
    aiService.parseCVForUserCreation.mockRejectedValue(new Error('Parsing failed'));
    
    render(<AdminIdentityManager showNotification={mockShowNotification} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add User')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add User'));
    fireEvent.click(screen.getByText('Upload CV'));
    
    const file = new File(['test cv content'], 'resume.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/upload cv file/i);
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    fireEvent.click(screen.getByText('Parse CV'));
    
    // Verify error notification
    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Failed to parse CV',
        'error'
      );
    });
  });

  test('should clear CV data when requested', async () => {
    render(<AdminIdentityManager showNotification={mockShowNotification} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add User')).toBeInTheDocument();
    });

    // Upload and parse CV
    fireEvent.click(screen.getByText('Add User'));
    fireEvent.click(screen.getByText('Upload CV'));
    
    const file = new File(['test cv content'], 'resume.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/upload cv file/i);
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    fireEvent.click(screen.getByText('Parse CV'));
    
    // Accept and map data
    await waitFor(() => {
      fireEvent.click(screen.getByText('Use This Data'));
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Apply Mapping'));
    });
    
    // Clear CV data
    await waitFor(() => {
      expect(screen.getByText('Clear CV Data')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Clear CV Data'));
    
    // Verify form is reset - form fields should be empty
    const firstNameInput = screen.getByLabelText('First Name');
    expect(firstNameInput.value).toBe('');
  });
});

describe('CV Components Integration', () => {
  test('CVDataPreview component integration', () => {
    const mockOnAccept = jest.fn();
    const mockOnReject = jest.fn();
    const mockOnClose = jest.fn();
    
    render(
      <CVDataPreview
        cvParsingResult={mockCVParsingResult}
        open={true}
        onClose={mockOnClose}
        onAcceptData={mockOnAccept}
        onRejectData={mockOnReject}
        aiService={aiService}
      />
    );
    
    expect(screen.getByText('CV Parsing Results')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
  });

  test('CVFieldMappingDialog component integration', () => {
    const mockOnMappingComplete = jest.fn();
    const mockOnClose = jest.fn();
    
    render(
      <CVFieldMappingDialog
        open={true}
        onClose={mockOnClose}
        cvData={mockCVParsingResult}
        formData={{}}
        onMappingComplete={mockOnMappingComplete}
        departments={['Engineering', 'IT']}
        positions={['Software Engineer', 'Senior Software Engineer']}
        roles={['USER', 'ADMIN']}
        aiService={aiService}
      />
    );
    
    expect(screen.getByText('Map CV Data to User Profile')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });
});