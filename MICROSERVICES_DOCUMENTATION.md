# Internal Management System - Microservices Architecture Documentation

## Overview

The Internal Management System is a comprehensive microservices-based platform designed for enterprise project and resource management. The system leverages advanced AI algorithms, modern cloud technologies, and real-time communication to provide intelligent task assignment, workload optimization, and collaborative features.

## System Architecture

The system follows a microservices architecture pattern with 13 core services, each serving specific business domains:

- **API Gateway**: Central routing and authentication
- **AI Service**: Intelligent recommendation engine with Google Gemini integration
- **ML Service**: Machine Learning training pipeline and model serving for continuous learning
- **Identity Service**: User authentication and authorization
- **Task Service**: Comprehensive task lifecycle management with integrated assignment capabilities
- **Project Service**: Project management and collaboration
- **Profile Service**: User profile and skill management
- **Workload Service**: Capacity planning and resource optimization
- **Chat Service**: Real-time messaging and communication
- **Notification Service**: Multi-channel notification system
- **File Service**: Document and media management
- **Post Service**: Social feed and announcement system
- **Search Service**: Advanced search and indexing (planned)

---

## 1. AI Service - Intelligent Recommendation Engine

### Core Functionality

The AI Service is the brain of the system, implementing sophisticated algorithms for automated decision-making and intelligent recommendations.

#### Key Algorithms and Components:

**1. Google Gemini AI Integration**
- **CV Analysis Engine**: Utilizes Google's Gemini AI for comprehensive resume parsing and analysis
- **Algorithm**: Large Language Model (LLM) processing with structured prompt engineering
- **Input**: Raw CV/resume content in various formats
- **Output**: Structured JSON with personal info, skills, experience, education, certifications
- **Features**:
  - Natural language processing for unstructured text
  - Skill extraction and categorization (PROGRAMMING_LANGUAGE, FRAMEWORK, DATABASE, TOOL, etc.)
  - Proficiency level assessment (BEGINNER, INTERMEDIATE, ADVANCED, EXPERT, MASTER)
  - Performance indicators calculation (productivity, adaptability, leadership potential)
  - Department matching based on skills and experience

**2. Hybrid Recommendation Algorithm**
- **Algorithm Type**: Combined Content-Based and Collaborative Filtering
- **Mathematical Model**:
  ```
  Hybrid Score = (Content-Based Weight × Content Score) + (Collaborative Weight × Collaborative Score)
  Default Weights: Content-Based = 0.6, Collaborative = 0.4
  ```

**Content-Based Filtering Components:**
- **Skill Matching (35% weight)**: Cosine similarity between required and user skills
- **Performance Score (25% weight)**: Historical performance metrics
- **Availability (20% weight)**: User availability and capacity
- **Workload Balance (15% weight)**: Current task distribution
- **Collaboration Score (5% weight)**: Team compatibility metrics

**Collaborative Filtering Components:**
- **Historical Assignment Patterns**: Analysis of successful past assignments
- **Team Performance Correlation**: Success rates of similar user-task combinations
- **Peer Similarity Analysis**: Behavioral and skill-based user clustering

**3. Requirements Analysis Engine**
- **Algorithm**: Natural Language Processing with domain-specific entity extraction
- **Function**: Analyzes task descriptions to identify required skills and complexity
- **Technology**: Custom NLP pipeline with predefined skill dictionaries

**4. Smart Candidate Selection**
- **Multi-criteria Decision Analysis**: Weighted scoring across multiple dimensions
- **Filtering Logic**: Department matching, skill requirements, availability constraints
- **Ranking Algorithm**: Composite scoring with penalty functions for overallocation

### Technical Implementation

**Technologies Used:**
- **Spring Boot**: Core framework
- **Google Gemini API**: AI/ML processing
- **WebClient**: Reactive HTTP client for external API calls
- **Jackson**: JSON processing and parsing
- **Custom Algorithm Classes**: HybridRecommendationAlgorithm, RequirementsAnalysisEngine

**Key Services:**
- `GeminiCVAnalysisService`: CV parsing and analysis
- `AIRecommendationService`: Main recommendation orchestrator
- `AITaskRecommendationService`: Task-specific recommendations
- `GeminiRecommendationService`: Enhanced AI-powered recommendations for high-priority tasks
- `AISkillAnalysisService`: Skill gap analysis and development recommendations

---

## 2. API Gateway - Central Routing Hub

### Core Functionality

**Authentication Filter**
- JWT token validation and introspection
- Route-based access control
- Public endpoint management (auth, registration, file downloads)
- Security header management

**Route Management**
- Centralized routing to all microservices
- Load balancing and failover
- Request/response transformation
- Rate limiting and throttling

**Key Features:**
- Spring Cloud Gateway integration
- WebFlux reactive programming
- Custom authentication filters
- Service discovery integration

---

## 2. ML Service - Machine Learning Training Pipeline & Model Serving

### Core Functionality

The ML Service provides advanced machine learning capabilities for continuous model training, performance prediction, and intelligent task assignment optimization through automated learning from user interactions.

#### Key Components:

**1. Hybrid Recommendation Training**
- **Algorithm Type**: Combined Content-Based (60%) + Collaborative Filtering (40%)
- **Training Engine**: Scikit-learn with Random Forest and SVD matrix factorization
- **Performance**: 85-90% accuracy with synthetic data, improving to 90%+ with real data
- **Features**:
  - Multi-database data collection (MySQL, Neo4j, MongoDB, PostgreSQL)
  - Automated feature engineering and selection
  - Cross-validation and hyperparameter tuning
  - A/B testing for model deployment

**2. Continuous Learning Pipeline**
- **Real-time Data Collection**: Kafka event streaming integration
- **Automated Retraining**: Scheduled weekly model updates
- **Performance Monitoring**: Model drift detection and accuracy tracking
- **Data Sources**: 
  - Task completion events from task-service
  - User interaction data from profile-service
  - Performance feedback from workload-service
  - Historical assignment success rates

**3. FastAPI Model Serving**
- **Endpoints**: Model training, prediction, status monitoring
- **Response Time**: < 100ms for predictions
- **Caching**: Redis integration for frequent predictions
- **Health Monitoring**: Comprehensive model performance metrics

**4. Multi-Database Integration**
- **MySQL**: Task, project, identity, workload data (identity-service, task-service, project-service, workload-service)
- **Neo4j**: User profiles and skills (profile-service)
- **MongoDB**: AI predictions and system interactions (ai-service, chat-service, notification-service, file-service)
- **PostgreSQL**: Consolidated ML training datasets and model history

**Architecture:**
```
Spring Boot ML Service (Port 8090)
├── REST API Controllers
├── Kafka Event Consumers
├── JPA Entities & Repositories
└── ML Event Production

Python FastAPI Service (Port 8000)  
├── Model Training Pipeline
├── Hybrid Recommender Engine
├── Continuous Learning System
└── Multi-DB Data Collection

Supporting Infrastructure
├── PostgreSQL: ML training data
├── Redis: Prediction caching
└── Kafka: Real-time events
```

**Key Features:**
- Hybrid machine learning models with 85-90% accuracy
- Real-time event processing for continuous learning
- Multi-database comprehensive data collection
- Automated model retraining and performance monitoring
- Docker containerization with production-ready deployment
- Comprehensive API for training, prediction, and monitoring

---

## 4. Identity Service - Authentication & Authorization

### Core Functionality

**Authentication System**
- **JWT Token Management**: Generation, validation, and refresh
- **Password Encryption**: BCrypt with configurable strength (default: 10 rounds)
- **Token Introspection**: Stateless token validation for gateway
- **Refresh Token Mechanism**: Secure token renewal

**User Management**
- User registration and profile creation
- Role-based access control (RBAC)
- Department and position management
- User availability status tracking

**Security Features**
- **Token Invalidation**: Blacklist for logout functionality
- **Configurable Token Expiry**: Separate validity and refresh durations
- **Security Headers**: CORS, CSRF protection
- **Password Policies**: Configurable complexity requirements

**Key Algorithms:**
- **JWT Signing**: HMAC-SHA256 with configurable secret key
- **Password Hashing**: BCrypt adaptive hashing
- **Token Validation**: Digital signature verification with expiry checks

---

## 5. Task Service - Comprehensive Task Management with Integrated Assignment

### Core Functionality

**Task Lifecycle Management**
- **Task Creation**: Comprehensive task definition with skills, priorities, dependencies
- **Status Tracking**: Complete workflow from creation to completion
- **Dependency Management**: Task interdependency resolution
- **Time Tracking**: Estimation vs. actual time analysis

**Integrated Assignment Management**
- **Direct Task Assignment**: Built-in assignment capabilities eliminating need for separate service
- **AI-Powered Recommendations**: Direct integration with AI service for intelligent suggestions
- **Assignment History Tracking**: Complete audit trail within task management
- **Reassignment Workflows**: Seamless task reassignment with reason tracking
- **Multi-Candidate Support**: Assignment workflow with candidate evaluation

**Advanced Features**
- **Task Dependencies**: Support for BLOCKS, DEPENDS_ON, CHILD_OF relationships
- **Skill Requirements**: Multi-dimensional skill matching with proficiency levels
- **Priority Management**: CRITICAL, HIGH, MEDIUM, LOW with intelligent escalation
- **Submission System**: File attachments, version control, approval workflows

**Real-time Integration**
- **Socket.IO Integration**: Live task updates and notifications
- **Project Integration**: Automatic project metrics updates
- **Chat Integration**: Task-specific communication channels
- **Notification System**: Multi-channel task event notifications

**Assignment Integration Features**
- **Project Member Auto-Addition**: Automatically adds assignees to project teams
- **Chat Group Integration**: Adds assigned users to relevant project chat groups
- **Notification Orchestration**: Sends assignment notifications through multiple channels
- **Performance Tracking**: Links assignment decisions to task completion outcomes

**Key Algorithms:**
- **Dependency Resolution**: Topological sorting for task ordering
- **Critical Path Analysis**: Project timeline optimization
- **Workload Estimation**: Historical data-based estimation algorithms
- **Assignment Optimization**: Integrated assignment logic with AI recommendation weighting

---

## 6. Project Service - Project Management Hub

### Core Functionality

**Project Lifecycle Management**
- Project creation, planning, and execution tracking
- Team member management and role assignment
- Project timeline and milestone tracking
- Resource allocation and budget management

**Collaboration Features**
- Project-based team formation
- Integrated communication channels
- Document and resource sharing
- Progress reporting and analytics

**Integration Points**
- Task service integration for project tasks
- Chat service for project communications
- File service for project documents
- Notification service for project updates

---

## 7. Profile Service - User Profile & Skill Management

### Core Functionality

**User Profile Management**
- Comprehensive user profiles with professional information
- Skill inventory and proficiency tracking
- Performance metrics and KPI monitoring
- Career development and goal tracking

**Skill Management System**
- **Skill Categories**: Technical, soft skills, domain knowledge
- **Proficiency Levels**: Standardized assessment scale
- **Skill Evolution Tracking**: Historical skill development
- **Certification Management**: Professional certifications and training records

**Performance Analytics**
- Performance metrics calculation and trending
- Skill gap analysis and recommendations
- Career path suggestions based on skills and goals
- Integration with AI service for personalized recommendations

---

## 8. Workload Service - Resource Optimization

### Core Functionality

**Capacity Management**
- **Weekly/Daily Capacity Planning**: Configurable work hour limits
- **Availability Calculation**: Real-time availability percentage
- **Workload Distribution**: Optimal task allocation across teams
- **Burnout Prevention**: Workload monitoring and alerts

**Task Workload Tracking**
- **Current Task Management**: Active task monitoring
- **Effort Estimation**: Historical data-based predictions
- **Time Allocation**: Smart scheduling and resource planning
- **Performance Impact Analysis**: Workload vs. quality correlation

**Key Algorithms:**
- **Capacity Planning Algorithm**: Multi-constraint optimization
- **Workload Balancing**: Genetic algorithm for optimal distribution
- **Availability Prediction**: Time series analysis for future capacity

---

## 9. Chat Service - Real-time Communication

### Core Functionality

**Multi-channel Communication**
- **Direct Messages**: Person-to-person communication
- **Group Chats**: Team and project-based conversations
- **File Sharing**: Integration with file service for document sharing
- **Message Reactions**: Enhanced interaction with emoji reactions

**Real-time Features**
- **WebSocket Integration**: Instant message delivery
- **Online Presence**: User availability status
- **Typing Indicators**: Real-time typing status
- **Message Delivery Confirmation**: Read receipts and delivery status

**Advanced Features**
- **Message Search**: Full-text search across conversation history
- **Thread Support**: Organized discussion threads
- **Integration Hooks**: Task and project context integration
- **Notification Integration**: Smart notification routing

---

## 10. Notification Service - Multi-channel Messaging

### Core Functionality

**Multi-channel Delivery**
- **Email Notifications**: SendGrid integration for email delivery
- **WebSocket Notifications**: Real-time web notifications
- **Socket.IO Integration**: Cross-platform real-time messaging
- **Push Notifications**: Mobile and desktop push support

**Notification Management**
- **Event-driven Architecture**: Kafka/RabbitMQ integration for event processing
- **Template Management**: Customizable notification templates
- **Preference Management**: User notification preferences
- **Delivery Tracking**: Notification delivery status and analytics

**Smart Routing**
- **Priority-based Routing**: Critical notifications get immediate delivery
- **Batching and Throttling**: Optimal notification frequency
- **Channel Selection**: Automatic channel selection based on urgency and preferences

---

## 11. File Service - Document Management

### Core Functionality

**File Storage and Management**
- **Secure File Upload**: Multi-format file support with validation
- **Cloud Storage Integration**: Scalable storage backend
- **Access Control**: User-based file permissions
- **Version Control**: File versioning and history tracking

**Media Processing**
- **Image Processing**: Thumbnail generation, format conversion
- **Document Parsing**: Text extraction for search indexing
- **Virus Scanning**: Security validation for uploaded files
- **Compression**: Automatic file optimization

---

## 12. Post Service - Social Feed System

### Core Functionality

**Social Feed Management**
- **Post Creation**: Rich content posting with media support
- **Timeline Management**: Chronological and algorithmic feed sorting
- **User Interactions**: Likes, comments, and sharing
- **Content Moderation**: Automated and manual content filtering

**Integration Features**
- **Profile Integration**: User profile enrichment for posts
- **File Integration**: Media attachment support
- **Notification Integration**: Social interaction notifications

---

## 13. Search Service - Advanced Search & Indexing

### Core Functionality

**Note**: This service is currently in planning/development phase with minimal implementation.

**Planned Features**:
- **Full-text Search**: Elasticsearch integration for comprehensive search
- **Semantic Search**: AI-powered contextual search capabilities
- **Multi-service Indexing**: Cross-service data indexing and search
- **Real-time Indexing**: Live data synchronization with search indices

---

## Technical Architecture Patterns

### Microservices Design Patterns

**1. API Gateway Pattern**
- Centralized routing and authentication
- Cross-cutting concerns handling
- Service discovery integration

**2. Circuit Breaker Pattern**
- Fault tolerance for service-to-service communication
- Graceful degradation during service failures
- Automatic recovery and health checking

**3. Event-Driven Architecture**
- Asynchronous communication between services
- Event sourcing for audit trails
- Real-time data synchronization

**4. CQRS (Command Query Responsibility Segregation)**
- Separate read and write operations
- Optimized data models for different use cases
- Scalable query performance

### Technology Stack

**Backend Framework**: Spring Boot 3.x with Java 17+
**Database**: MySQL for transactional data, Redis for caching
**Message Queuing**: Apache Kafka for event streaming
**API Gateway**: Spring Cloud Gateway
**Security**: JWT with Spring Security
**Real-time Communication**: WebSocket, Socket.IO
**AI/ML Integration**: Google Gemini API
**External Services**: SendGrid (Email), Cloud Storage
**Monitoring**: Spring Actuator, Micrometer
**Documentation**: OpenAPI 3.0 (Swagger)

### Data Flow Architecture

1. **User Request Flow**: Client → API Gateway → Microservice → Database
2. **AI Recommendation Flow**: Frontend/Task Service → AI Service → Gemini API → Response Processing
3. **Real-time Communication**: Client ↔ WebSocket Server ↔ Message Queue ↔ Target Services
4. **Event Processing**: Service Event → Message Queue → Event Handlers → Side Effects

### Security Architecture

**Authentication Flow**:
1. User login → Identity Service
2. JWT token generation with user claims
3. Token validation at API Gateway
4. Service-to-service communication with service tokens

**Authorization Model**:
- Role-based access control (RBAC)
- Resource-based permissions
- Method-level security annotations
- API endpoint protection

---

## Performance and Scalability Considerations

### AI Service Optimization
- **Gemini API Rate Limiting**: Intelligent request batching and caching
- **Fallback Algorithms**: Local ML models for high-availability scenarios
- **Result Caching**: Redis-based caching for frequently accessed recommendations

### Database Optimization
- **Read Replicas**: Separate read and write database instances
- **Query Optimization**: Indexed queries and optimized data structures
- **Data Partitioning**: Horizontal scaling for large datasets

### Real-time Communication Scaling
- **WebSocket Load Balancing**: Sticky sessions and connection pooling
- **Message Queue Scaling**: Kafka partitioning for high throughput
- **Connection Management**: Efficient connection lifecycle management

---

## Future Enhancements and Roadmap

### AI/ML Improvements
1. **Advanced ML Models**: Custom trained models for domain-specific recommendations
2. **Predictive Analytics**: Project timeline and resource demand prediction
3. **Natural Language Processing**: Advanced task description analysis and automation

### System Enhancements
1. **Mobile Applications**: Native iOS and Android applications
2. **Advanced Analytics**: Business intelligence and reporting dashboards
3. **Integration Ecosystem**: Third-party tool integrations (JIRA, Slack, etc.)
4. **Advanced Search**: Elasticsearch-based full-text search implementation

### Performance Optimization
1. **Microservices Mesh**: Service mesh architecture for advanced traffic management
2. **Auto-scaling**: Kubernetes-based auto-scaling for dynamic load handling
3. **Edge Computing**: CDN integration for global performance optimization

---

## Conclusion

The Internal Management System represents a sophisticated microservices architecture that combines modern software engineering practices with advanced AI capabilities. The system's modular design ensures scalability, maintainability, and extensibility while providing intelligent automation for enterprise resource management.

The integration of Google Gemini AI for CV analysis and task recommendations, combined with hybrid recommendation algorithms, provides a competitive advantage in intelligent resource allocation and workforce optimization. The real-time communication infrastructure and comprehensive notification system ensure seamless collaboration and information flow across the organization.

This architecture serves as a solid foundation for enterprise-grade internal management solutions, with the flexibility to adapt to changing business requirements and scale with organizational growth.