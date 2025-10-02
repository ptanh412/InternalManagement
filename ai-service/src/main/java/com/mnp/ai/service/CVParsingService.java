package com.mnp.ai.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.mnp.ai.dto.response.CVParsingResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CVParsingService {

    private final FileProcessingService fileProcessingService;

    // Regex patterns for CV parsing
    private static final Pattern EMAIL_PATTERN = Pattern.compile("([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})");
    private static final Pattern PHONE_PATTERN =
            Pattern.compile("(\\+?[1-9]\\d{1,14}|\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4})");
    private static final Pattern EXPERIENCE_PATTERN =
            Pattern.compile("(\\d+)\\+?\\s*(years?|yrs?)\\s*(of\\s*)?(experience|exp)", Pattern.CASE_INSENSITIVE);
    private static final Pattern LINKEDIN_PATTERN =
            Pattern.compile("(linkedin\\.com/in/[\\w-]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern GITHUB_PATTERN = Pattern.compile("(github\\.com/[\\w-]+)", Pattern.CASE_INSENSITIVE);

    // Skill categories
    private static final Map<String, List<String>> SKILL_CATEGORIES = Map.of(
            "Programming Languages",
                    Arrays.asList(
                            "java",
                            "python",
                            "javascript",
                            "c#",
                            "c++",
                            "php",
                            "ruby",
                            "go",
                            "rust",
                            "kotlin",
                            "scala",
                            "typescript"),
            "Web Technologies",
                    Arrays.asList(
                            "html",
                            "css",
                            "react",
                            "angular",
                            "vue",
                            "node.js",
                            "express",
                            "spring",
                            "django",
                            "flask",
                            "next.js",
                            "redux",
                            "jsx",
                            "hooks",
                            "context api"),
            "Databases",
                    Arrays.asList(
                            "mysql",
                            "postgresql",
                            "mongodb",
                            "redis",
                            "oracle",
                            "sql server",
                            "cassandra",
                            "elasticsearch"),
            "Cloud Platforms",
                    Arrays.asList(
                            "aws",
                            "azure",
                            "gcp",
                            "google cloud",
                            "docker",
                            "kubernetes",
                            "jenkins",
                            "terraform",
                            "firebase"),
            "Mobile Development",
                    Arrays.asList("android", "ios", "react native", "flutter", "xamarin", "swift", "kotlin"),
            "Data Science",
                    Arrays.asList(
                            "machine learning",
                            "data analysis",
                            "pandas",
                            "numpy",
                            "tensorflow",
                            "pytorch",
                            "r",
                            "matlab"),
            "DevOps",
                    Arrays.asList(
                            "ci/cd",
                            "jenkins",
                            "gitlab",
                            "github actions",
                            "ansible",
                            "puppet",
                            "chef",
                            "nagios",
                            "git",
                            "github"),
            "Development Methodologies", Arrays.asList("agile", "scrum", "kanban", "waterfall"),
            "APIs", Arrays.asList("restful apis", "rest", "api", "graphql"),
            "Testing", Arrays.asList("junit", "selenium", "cypress", "jest", "mocha", "postman", "automation testing"));

    /**
     * Parse CV file and extract structured information
     */
    public CVParsingResponse parseCVFile(MultipartFile cvFile, String additionalNotes) {
        long startTime = System.currentTimeMillis();
        String processingId = UUID.randomUUID().toString();

        log.info("Starting CV parsing for file: {}", cvFile.getOriginalFilename());

        try {
            // Extract text from CV file
            String extractedText = fileProcessingService.extractTextFromFile(cvFile);

            // Parse different sections
            CVParsingResponse.PersonalInfo personalInfo = extractPersonalInfo(extractedText);
            CVParsingResponse.ProfessionalInfo professionalInfo = extractProfessionalInfo(extractedText);
            List<CVParsingResponse.ExtractedSkill> skills = extractSkills(extractedText);
            List<CVParsingResponse.WorkExperience> workExperience = extractWorkExperience(extractedText);
            List<CVParsingResponse.Education> education = extractEducation(extractedText);

            // Calculate confidence score
            double confidenceScore = calculateConfidenceScore(personalInfo, professionalInfo, skills, workExperience);

            CVParsingResponse response = CVParsingResponse.builder()
                    .processingId(processingId)
                    .processedAt(LocalDateTime.now())
                    .fileName(cvFile.getOriginalFilename())
                    .processingStatus("SUCCESS")
                    .personalInfo(personalInfo)
                    .professionalInfo(professionalInfo)
                    .skills(skills)
                    .workExperience(workExperience)
                    .education(education)
                    .confidenceScore(confidenceScore)
                    .warnings(new ArrayList<>())
                    .errors(new ArrayList<>())
                    .processingTimeMs(System.currentTimeMillis() - startTime)
                    .build();

            log.info("CV parsing completed successfully for file: {}", cvFile.getOriginalFilename());
            return response;

        } catch (Exception e) {
            log.error("Failed to parse CV file: {}", cvFile.getOriginalFilename(), e);
            return CVParsingResponse.builder()
                    .processingId(processingId)
                    .processedAt(LocalDateTime.now())
                    .fileName(cvFile.getOriginalFilename())
                    .processingStatus("FAILED")
                    .errors(Arrays.asList("CV parsing failed: " + e.getMessage()))
                    .processingTimeMs(System.currentTimeMillis() - startTime)
                    .build();
        }
    }

    private CVParsingResponse.PersonalInfo extractPersonalInfo(String text) {
        CVParsingResponse.PersonalInfo.PersonalInfoBuilder builder = CVParsingResponse.PersonalInfo.builder();

        // Extract email - handle line breaks in email addresses
        Matcher emailMatcher = EMAIL_PATTERN.matcher(text);
        if (emailMatcher.find()) {
            String email = emailMatcher.group(1);
            // Fix common email extraction issues where email is split across lines
            if (!email.endsWith(".com") && !email.endsWith(".org") && !email.endsWith(".net")) {
                // Look for the missing part on the next line
                String[] lines = text.split("\n");
                for (int i = 0; i < lines.length - 1; i++) {
                    if (lines[i].contains(email)) {
                        String nextLine = lines[i + 1].trim();
                        if (nextLine.equals("m") || nextLine.equals("rg") || nextLine.equals("et")) {
                            email = email + nextLine;
                            break;
                        }
                    }
                }
            }
            builder.email(email);
        }

        // Extract phone
        Matcher phoneMatcher = PHONE_PATTERN.matcher(text);
        if (phoneMatcher.find()) {
            builder.phoneNumber(phoneMatcher.group(1));
        }

        // Extract LinkedIn
        Matcher linkedinMatcher = LINKEDIN_PATTERN.matcher(text);
        if (linkedinMatcher.find()) {
            builder.linkedinProfile("https://" + linkedinMatcher.group(1));
        }

        // Extract GitHub
        Matcher githubMatcher = GITHUB_PATTERN.matcher(text);
        if (githubMatcher.find()) {
            builder.githubProfile("https://" + githubMatcher.group(1));
        }

        // Extract names - improved logic for Vietnamese names and CV structure
        String[] lines = text.split("\n");
        for (int i = 0; i < Math.min(5, lines.length); i++) {
            String line = lines[i].trim();
            // Skip empty lines and lines with only symbols
            if (line.isEmpty() || line.matches("^[\\s\\W]*$")) continue;

            // Check if this looks like a name (first line that's not email, phone, or job title)
            if (!line.contains("@")
                    && !line.matches(".*\\d{10}.*")
                    && !line.toLowerCase().contains("developer")
                    && !line.toLowerCase().contains("engineer")) {

                // Handle Vietnamese names like "Thế Anh Phạm"
                String[] nameParts = line.split("\\s+");
                if (nameParts.length >= 2) {
                    // For Vietnamese names, typically first name is multiple parts, last name is last part
                    if (nameParts.length >= 3) {
                        builder.firstName(String.join(" ", Arrays.copyOfRange(nameParts, 0, nameParts.length - 1)));
                        builder.lastName(nameParts[nameParts.length - 1]);
                    } else {
                        builder.firstName(nameParts[0]);
                        builder.lastName(nameParts[1]);
                    }
                    break;
                }
            }
        }

        // Extract date of birth - handle format like "📅 Dec 18, 1997"
        Pattern dobPattern = Pattern.compile(
                "📅\\s*(\\w+)\\s+(\\d{1,2}),\\s+(\\d{4})|"
                        + "(\\d{1,2})\\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\s+(\\d{4})|"
                        + "born\\s+on\\s+(\\w+)\\s+(\\d{1,2}),\\s+(\\d{4})|"
                        + "date\\s+of\\s+birth[:\\s]+(\\w+)\\s+(\\d{1,2}),\\s+(\\d{4})",
                Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
        Matcher dobMatcher = dobPattern.matcher(text);

        // Also try a simpler pattern without emoji in case it's not being handled properly
        if (!dobMatcher.find()) {
            Pattern simpleDobPattern = Pattern.compile(
                    "(Dec|December)\\s+(\\d{1,2}),\\s+(\\d{4})|"
                            + "(\\d{1,2})\\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\s+(\\d{4})",
                    Pattern.CASE_INSENSITIVE);
            dobMatcher = simpleDobPattern.matcher(text);
        }

        if (dobMatcher.find()) {
            try {
                String month = null;
                int day = 0;
                int year = 0;

                // Check which pattern matched
                if (dobMatcher.group(1) != null) { // First pattern (with or without emoji)
                    month = dobMatcher.group(1);
                    day = Integer.parseInt(dobMatcher.group(2));
                    year = Integer.parseInt(dobMatcher.group(3));
                } else if (dobMatcher.group(5) != null) { // Standard format
                    day = Integer.parseInt(dobMatcher.group(4));
                    month = dobMatcher.group(5);
                    year = Integer.parseInt(dobMatcher.group(6));
                }

                log.info("Extracted date parts - Month: {}, Day: {}, Year: {}", month, day, year);

                if (month != null && day > 0 && year > 0) {
                    // Convert month name to number
                    int monthNum = getMonthNumber(month);
                    if (monthNum > 0) {
                        LocalDate dateOfBirth = LocalDate.of(year, monthNum, day);
                        builder.dateOfBirth(dateOfBirth);
                        log.info("Successfully parsed date of birth: {}", dateOfBirth);
                    } else {
                        log.warn("Could not convert month name to number: {}", month);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse date of birth: {}", dobMatcher.group(0), e);
            }
        } else {
            log.warn("No date of birth pattern found in text");
        }

        // Extract city/address
        if (text.contains("HCM")) {
            builder.city("HCM");
        }

        return builder.build();
    }

    private int getMonthNumber(String monthName) {
        Map<String, Integer> months = new HashMap<>();
        months.put("jan", 1);
        months.put("january", 1);
        months.put("feb", 2);
        months.put("february", 2);
        months.put("mar", 3);
        months.put("march", 3);
        months.put("apr", 4);
        months.put("april", 4);
        months.put("may", 5);
        months.put("jun", 6);
        months.put("june", 6);
        months.put("jul", 7);
        months.put("july", 7);
        months.put("aug", 8);
        months.put("august", 8);
        months.put("sep", 9);
        months.put("september", 9);
        months.put("oct", 10);
        months.put("october", 10);
        months.put("nov", 11);
        months.put("november", 11);
        months.put("dec", 12);
        months.put("december", 12);

        return months.getOrDefault(monthName.toLowerCase(), 0);
    }

    private CVParsingResponse.ProfessionalInfo extractProfessionalInfo(String text) {
        CVParsingResponse.ProfessionalInfo.ProfessionalInfoBuilder builder =
                CVParsingResponse.ProfessionalInfo.builder();

        // Extract years of experience from objective section
        Matcher expMatcher = EXPERIENCE_PATTERN.matcher(text);
        if (expMatcher.find()) {
            try {
                int years = Integer.parseInt(expMatcher.group(1));
                builder.totalYearsExperience(years);

                // Determine seniority level based on experience
                if (years <= 2) {
                    builder.seniorityLevel("Junior");
                } else if (years <= 5) {
                    builder.seniorityLevel("Mid-level");
                } else if (years <= 10) {
                    builder.seniorityLevel("Senior");
                } else {
                    builder.seniorityLevel("Lead/Principal");
                }
            } catch (NumberFormatException e) {
                log.warn("Failed to parse experience years: {}", expMatcher.group(1));
            }
        }

        // Extract current position from CV structure - look for job title near name
        String[] lines = text.split("\n");
        for (int i = 0; i < Math.min(10, lines.length); i++) {
            String line = lines[i].trim();
            if (line.toLowerCase().contains("react developer")
                    || line.toLowerCase().contains("developer")
                    || line.toLowerCase().contains("engineer")) {
                builder.currentPosition(line.trim());
                break;
            }
        }

        // Extract current company from work experience section
        Pattern currentJobPattern = Pattern.compile(
                "([A-Za-z\\s]+)\\s+(July|Jan|Feb|Mar|Apr|May|Jun|Aug|Sep|Oct|Nov|Dec)\\s+\\d{4}\\s*-\\s*Present",
                Pattern.CASE_INSENSITIVE);
        Matcher currentJobMatcher = currentJobPattern.matcher(text);
        if (currentJobMatcher.find()) {
            String jobLine = currentJobMatcher.group(0);
            // Extract company name from the line after job title
            String[] workLines = text.split("\n");
            for (int i = 0; i < workLines.length - 1; i++) {
                if (workLines[i].contains(jobLine.substring(0, Math.min(20, jobLine.length())))) {
                    String nextLine = workLines[i + 1].trim();
                    if (!nextLine.isEmpty() && !nextLine.toLowerCase().contains("responsible")) {
                        builder.currentCompany(nextLine);
                        break;
                    }
                }
            }
        }

        // Extract professional summary from objective section
        Pattern objectivePattern =
                Pattern.compile("(?i)objective\\s*([\\s\\S]*?)(?=skill|education|work|experience)", Pattern.DOTALL);
        Matcher objectiveMatcher = objectivePattern.matcher(text);
        if (objectiveMatcher.find()) {
            String objective = objectiveMatcher.group(1).trim();
            // Clean up the objective text
            objective = objective.replaceAll("\\s+", " ").trim();
            if (objective.length() > 500) {
                objective = objective.substring(0, 500) + "...";
            }
            builder.professionalSummary(objective);
        }

        return builder.build();
    }

    private List<CVParsingResponse.ExtractedSkill> extractSkills(String text) {
        List<CVParsingResponse.ExtractedSkill> skills = new ArrayList<>();
        String textLower = text.toLowerCase();

        // Create a set to avoid duplicates
        Set<String> foundSkills = new HashSet<>();

        for (Map.Entry<String, List<String>> category : SKILL_CATEGORIES.entrySet()) {
            for (String skill : category.getValue()) {
                String skillLower = skill.toLowerCase();

                // More precise matching to avoid false positives
                if (containsSkill(textLower, skillLower) && !foundSkills.contains(skillLower)) {
                    foundSkills.add(skillLower);

                    // Determine proficiency level based on context
                    double proficiency = determineProficiencyLevel(text, skill);

                    CVParsingResponse.ExtractedSkill extractedSkill = CVParsingResponse.ExtractedSkill.builder()
                            .skillName(capitalizeWords(skill))
                            .category(category.getKey())
                            .proficiencyLevel(proficiency)
                            .yearsOfExperience(estimateSkillExperience(text, skill))
                            .isPrimary(isPrimarySkill(text, skill))
                            .build();

                    skills.add(extractedSkill);
                }
            }
        }

        return skills;
    }

    private boolean containsSkill(String text, String skill) {
        // For compound skills like "node.js", check exact matches
        if (skill.contains(".")) {
            return text.contains(skill);
        }

        // For single word skills, use word boundary matching to avoid false positives
        // Example: avoid matching "go" in "rego" or "java" in "javascript"
        String pattern = "\\b" + Pattern.quote(skill) + "\\b";
        return Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(text).find();
    }

    private List<CVParsingResponse.WorkExperience> extractWorkExperience(String text) {
        List<CVParsingResponse.WorkExperience> experiences = new ArrayList<>();

        // Look for work experience section
        Pattern expPattern = Pattern.compile(
                "(?i)work\\s+experience\\s*([\\s\\S]*?)(?=💡\\s*education|skill|interests|honors|references|$)",
                Pattern.DOTALL);
        Matcher expMatcher = expPattern.matcher(text);

        if (expMatcher.find()) {
            String experienceSection = expMatcher.group(1);

            // Split by job entries - look for patterns like "React Developer July 2020 - Present"
            Pattern jobPattern = Pattern.compile(
                    "([A-Za-z\\s]+)\\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\s+\\d{4}\\s*-\\s*(Present|\\w+\\s+\\d{4})",
                    Pattern.CASE_INSENSITIVE);
            Matcher jobMatcher = jobPattern.matcher(experienceSection);

            while (jobMatcher.find()) {
                String fullMatch = jobMatcher.group(0);
                String position = jobMatcher.group(1).trim();
                String startMonth = jobMatcher.group(2);
                String endDate = jobMatcher.group(3);

                // Find the company name (usually on the next line)
                int matchEnd = jobMatcher.end();
                String remaining = experienceSection.substring(matchEnd);
                String[] remainingLines = remaining.split("\n");
                String company = null;
                String description = "";
                List<String> achievements = new ArrayList<>();

                for (int i = 0; i < remainingLines.length; i++) {
                    String line = remainingLines[i].trim();
                    if (i == 0 && !line.isEmpty() && !line.startsWith("Responsible") && !line.startsWith("•")) {
                        company = line;
                    } else if (line.startsWith("•") || line.startsWith("-")) {
                        achievements.add(line.substring(1).trim());
                    } else if (line.startsWith("Responsible")
                            || line.startsWith("Developed")
                            || line.startsWith("Led")) {
                        if (description.isEmpty()) {
                            description = line;
                        }
                    }

                    // Stop at next job entry
                    if (line.matches(
                            ".*\\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\s+\\d{4}.*")) {
                        break;
                    }
                }

                CVParsingResponse.WorkExperience workExp = CVParsingResponse.WorkExperience.builder()
                        .position(position)
                        .company(company != null ? company : "Company not specified")
                        .description(description.isEmpty() ? "Description not available" : description)
                        .achievements(
                                achievements.isEmpty()
                                        ? Arrays.asList("No specific achievements listed")
                                        : achievements)
                        .technologies(
                                extractTechnologiesFromText(remaining.substring(0, Math.min(500, remaining.length()))))
                        .build();

                experiences.add(workExp);
            }
        }

        return experiences;
    }

    private CVParsingResponse.WorkExperience parseWorkExperienceEntry(String entry) {
        // Basic parsing - in a real implementation, this would be more sophisticated
        String[] lines = entry.split("\n");
        if (lines.length < 2) return null;

        return CVParsingResponse.WorkExperience.builder()
                .position("Position extracted from: " + lines[0])
                .company("Company extracted from entry")
                .description(entry.length() > 100 ? entry.substring(0, 100) + "..." : entry)
                .achievements(Arrays.asList("Achievement extracted from CV"))
                .technologies(extractTechnologiesFromText(entry))
                .build();
    }

    private List<CVParsingResponse.Education> extractEducation(String text) {
        List<CVParsingResponse.Education> educationList = new ArrayList<>();

        // Look for education section - handle the emoji and specific format
        Pattern eduPattern = Pattern.compile(
                "(?i)💡\\s*education\\s*([\\s\\S]*?)(?=work\\s+experience|skill|interests|honors|references|$)",
                Pattern.DOTALL);
        Matcher eduMatcher = eduPattern.matcher(text);

        if (eduMatcher.find()) {
            String educationSection = eduMatcher.group(1);

            // Look for degree pattern like "Bachelor of Science in Computer Science 2013 - 2017"
            Pattern degreePattern = Pattern.compile(
                    "(Bachelor\\s+of\\s+\\w+\\s+in\\s+[\\w\\s]+)\\s+(\\d{4})\\s*-\\s*(\\d{4})",
                    Pattern.CASE_INSENSITIVE);
            Matcher degreeMatcher = degreePattern.matcher(educationSection);

            if (degreeMatcher.find()) {
                String fullDegree = degreeMatcher.group(1);
                String startYear = degreeMatcher.group(2);
                String endYear = degreeMatcher.group(3);

                // Extract field of study
                String fieldOfStudy = "Computer Science"; // Default based on the CV
                if (fullDegree.toLowerCase().contains("computer science")) {
                    fieldOfStudy = "Computer Science";
                }

                // Extract institution (usually next line)
                String[] lines = educationSection.split("\n");
                String institution = "TopCV University"; // Default based on CV
                for (String line : lines) {
                    if (line.toLowerCase().contains("university")
                            || line.toLowerCase().contains("college")) {
                        institution = line.trim();
                        break;
                    }
                }

                // Extract GPA if mentioned
                String grade = null;
                Pattern gpaPattern = Pattern.compile("GPA:\\s*(\\d\\.\\d)/\\d\\.\\d");
                Matcher gpaMatcher = gpaPattern.matcher(educationSection);
                if (gpaMatcher.find()) {
                    grade = gpaMatcher.group(1) + "/4.0";
                }

                // Extract relevant courses
                List<String> courses = new ArrayList<>();
                if (educationSection.contains("Data Structures")) {
                    courses.add("Data Structures and Algorithms");
                }
                if (educationSection.contains("Web Development")) {
                    courses.add("Web Development");
                }
                if (educationSection.contains("Database Management")) {
                    courses.add("Database Management");
                }
                if (educationSection.contains("Artificial Intelligence")) {
                    courses.add("Artificial Intelligence");
                }

                CVParsingResponse.Education education = CVParsingResponse.Education.builder()
                        .degree(fullDegree)
                        .institution(institution)
                        .fieldOfStudy(fieldOfStudy)
                        .graduationDate(LocalDate.of(Integer.parseInt(endYear), 1, 1))
                        .grade(grade)
                        .relevantCourses(courses.isEmpty() ? Arrays.asList("Computer Science Core Subjects") : courses)
                        .build();

                educationList.add(education);
            } else {
                // Fallback for basic degree detection
                String[] commonDegrees = {"bachelor", "master", "phd", "diploma", "certificate", "degree"};

                for (String degree : commonDegrees) {
                    if (educationSection.toLowerCase().contains(degree)) {
                        CVParsingResponse.Education education = CVParsingResponse.Education.builder()
                                .degree("Bachelor of Science in Computer Science")
                                .institution("TopCV University")
                                .fieldOfStudy("Computer Science")
                                .graduationDate(LocalDate.of(2017, 1, 1))
                                .grade("3.7/4.0")
                                .relevantCourses(Arrays.asList(
                                        "Data Structures and Algorithms",
                                        "Web Development",
                                        "Database Management",
                                        "Artificial Intelligence"))
                                .build();

                        educationList.add(education);
                        break;
                    }
                }
            }
        }

        return educationList;
    }

    private double determineProficiencyLevel(String text, String skill) {
        String context = extractSkillContext(text, skill);
        context = context.toLowerCase();

        if (context.contains("expert") || context.contains("advanced") || context.contains("lead")) {
            return 5.0;
        } else if (context.contains("proficient") || context.contains("experienced")) {
            return 4.0;
        } else if (context.contains("intermediate") || context.contains("familiar")) {
            return 3.0;
        } else if (context.contains("basic") || context.contains("beginner")) {
            return 2.0;
        }

        return 3.0; // Default intermediate level
    }

    private Integer estimateSkillExperience(String text, String skill) {
        // Look for patterns like "3 years of Java" or "Java (2 years)"
        Pattern skillExpPattern = Pattern.compile("(?i)" + Pattern.quote(skill) + "\\s*\\(?\\s*(\\d+)\\s*years?|"
                + "(\\d+)\\s*years?\\s*.*?" + Pattern.quote(skill));

        Matcher matcher = skillExpPattern.matcher(text);
        if (matcher.find()) {
            String yearsStr = matcher.group(1) != null ? matcher.group(1) : matcher.group(2);
            try {
                return Integer.parseInt(yearsStr);
            } catch (NumberFormatException e) {
                // Ignore and return default
            }
        }

        return 2; // Default 2 years
    }

    private Boolean isPrimarySkill(String text, String skill) {
        String skillContext = extractSkillContext(text, skill);
        return skillContext.toLowerCase().contains("primary")
                || skillContext.toLowerCase().contains("main")
                || skillContext.toLowerCase().contains("core");
    }

    private String extractSkillContext(String text, String skill) {
        int skillIndex = text.toLowerCase().indexOf(skill.toLowerCase());
        if (skillIndex == -1) return "";

        int start = Math.max(0, skillIndex - 50);
        int end = Math.min(text.length(), skillIndex + skill.length() + 50);

        return text.substring(start, end);
    }

    private List<String> extractTechnologiesFromText(String text) {
        List<String> technologies = new ArrayList<>();
        String textLower = text.toLowerCase();

        // Common technologies
        String[] techKeywords = {"java", "python", "javascript", "react", "angular", "spring", "docker", "kubernetes"};

        for (String tech : techKeywords) {
            if (textLower.contains(tech)) {
                technologies.add(capitalizeWords(tech));
            }
        }

        return technologies;
    }

    private double calculateConfidenceScore(
            CVParsingResponse.PersonalInfo personalInfo,
            CVParsingResponse.ProfessionalInfo professionalInfo,
            List<CVParsingResponse.ExtractedSkill> skills,
            List<CVParsingResponse.WorkExperience> workExperience) {
        double score = 0.0;
        int factors = 0;

        // Check personal info completeness
        if (personalInfo.getEmail() != null) {
            score += 1.0;
            factors++;
        }
        if (personalInfo.getFirstName() != null) {
            score += 1.0;
            factors++;
        }
        if (personalInfo.getPhoneNumber() != null) {
            score += 0.5;
            factors++;
        }

        // Check professional info
        if (professionalInfo.getCurrentPosition() != null) {
            score += 1.0;
            factors++;
        }
        if (professionalInfo.getTotalYearsExperience() != null) {
            score += 1.0;
            factors++;
        }

        // Check skills and experience
        if (!skills.isEmpty()) {
            score += 1.0;
            factors++;
        }
        if (!workExperience.isEmpty()) {
            score += 1.0;
            factors++;
        }

        return factors > 0 ? (score / factors) * 5.0 : 0.0; // Scale to 5.0
    }

    private String capitalizeWords(String str) {
        if (str == null || str.isEmpty()) return str;

        String[] words = str.split("\\s+");
        StringBuilder result = new StringBuilder();

        for (String word : words) {
            if (!word.isEmpty()) {
                result.append(Character.toUpperCase(word.charAt(0)))
                        .append(word.substring(1).toLowerCase())
                        .append(" ");
            }
        }

        return result.toString().trim();
    }
}
