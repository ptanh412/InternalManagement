package com.mnp.ai.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.mnp.ai.dto.response.CVAnalysisResult;
import com.mnp.ai.dto.response.ParsedUserProfile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class RegexBasedCVParserService {

    private final IdentityIntegrationService identityIntegrationService;

    // Common patterns
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"
    );

    private static final Pattern PHONE_PATTERN = Pattern.compile(
            "(?:\\+84|0)(?:\\d{9,10})|(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{1,4}\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}"
    );

    private static final Pattern LINKEDIN_PATTERN = Pattern.compile(
            "(?:https?://)?(?:www\\.)?linkedin\\.com/in/[\\w-]+/?",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern GITHUB_PATTERN = Pattern.compile(
            "(?:https?://)?(?:www\\.)?github\\.com/[\\w-]+/?",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern DATE_PATTERN = Pattern.compile(
            "\\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s+\\d{4}\\b|\\b\\d{1,2}[/-]\\d{4}\\b|\\b\\d{4}\\b"
    );

    // Skill keywords database
    private static final Map<String, String> SKILL_KEYWORDS = Map.ofEntries(
            // Programming Languages
            Map.entry("java", "PROGRAMMING_LANGUAGE"),
            Map.entry("python", "PROGRAMMING_LANGUAGE"),
            Map.entry("javascript", "PROGRAMMING_LANGUAGE"),
            Map.entry("typescript", "PROGRAMMING_LANGUAGE"),
            Map.entry("c++", "PROGRAMMING_LANGUAGE"),
            Map.entry("c#", "PROGRAMMING_LANGUAGE"),
            Map.entry("php", "PROGRAMMING_LANGUAGE"),
            Map.entry("ruby", "PROGRAMMING_LANGUAGE"),
            Map.entry("go", "PROGRAMMING_LANGUAGE"),
            Map.entry("kotlin", "PROGRAMMING_LANGUAGE"),
            Map.entry("swift", "PROGRAMMING_LANGUAGE"),

            // Frameworks
            Map.entry("spring", "FRAMEWORK"),
            Map.entry("spring boot", "FRAMEWORK"),
            Map.entry("react", "FRAMEWORK"),
            Map.entry("angular", "FRAMEWORK"),
            Map.entry("vue", "FRAMEWORK"),
            Map.entry("django", "FRAMEWORK"),
            Map.entry("flask", "FRAMEWORK"),
            Map.entry("express", "FRAMEWORK"),
            Map.entry("nestjs", "FRAMEWORK"),
            Map.entry("laravel", "FRAMEWORK"),
            Map.entry(".net", "FRAMEWORK"),

            // Databases
            Map.entry("mysql", "DATABASE"),
            Map.entry("postgresql", "DATABASE"),
            Map.entry("mongodb", "DATABASE"),
            Map.entry("oracle", "DATABASE"),
            Map.entry("sql server", "DATABASE"),
            Map.entry("redis", "DATABASE"),
            Map.entry("elasticsearch", "DATABASE"),
            Map.entry("cassandra", "DATABASE"),

            // Tools
            Map.entry("docker", "TOOL"),
            Map.entry("kubernetes", "TOOL"),
            Map.entry("jenkins", "TOOL"),
            Map.entry("git", "TOOL"),
            Map.entry("maven", "TOOL"),
            Map.entry("gradle", "TOOL"),
            Map.entry("jira", "TOOL"),
            Map.entry("postman", "TOOL"),
            Map.entry("aws", "TOOL"),
            Map.entry("azure", "TOOL"),
            Map.entry("gcp", "TOOL"),

            // Soft Skills
            Map.entry("leadership", "SOFT_SKILL"),
            Map.entry("communication", "SOFT_SKILL"),
            Map.entry("teamwork", "SOFT_SKILL"),
            Map.entry("problem solving", "SOFT_SKILL"),
            Map.entry("agile", "SOFT_SKILL"),
            Map.entry("scrum", "SOFT_SKILL")
    );

    public CVAnalysisResult analyzeCV(String cvContent, String fileName) {
        log.info("Analyzing CV with Regex-based parser: {}", fileName);

        try {
            long startTime = System.currentTimeMillis();

            // Normalize content
            String normalizedContent = normalizeText(cvContent);

            // Extract all information
            ParsedUserProfile userProfile = ParsedUserProfile.builder()
                    .name(extractName(normalizedContent))
                    .email(extractEmail(normalizedContent))
                    .phone(extractPhone(normalizedContent))
                    .linkedIn(extractLinkedIn(normalizedContent))
                    .github(extractGitHub(normalizedContent))
                    .city(extractLocation(normalizedContent))
                    .skills(extractSkills(normalizedContent))
                    .skillTypes(extractSkillTypes(normalizedContent))
                    .skillExperience(estimateSkillExperience(normalizedContent))
                    .mandatorySkills(identifyMandatorySkills(normalizedContent))
                    .workHistory(extractWorkExperience(normalizedContent))
                    .education(extractEducation(normalizedContent))
                    .certifications(extractCertifications(normalizedContent))
                    .certificationsDetails(extractCertificationDetails(normalizedContent))
                    .projects(extractProjects(normalizedContent))
                    .languages(extractLanguages(normalizedContent))
                    .experienceYears(calculateTotalExperience(normalizedContent))
                    .currentRole(extractCurrentRole(normalizedContent))
                    .estimatedProductivity(0.75)
                    .adaptabilityScore(0.75)
                    .leadershipPotential(0.6)
                    .technicalComplexityHandling(0.7)
                    .collaborationScore(0.8)
                    .build();

            // Auto-map department and seniority
            Map<String, Double> skills = userProfile.getSkills();
            String department = identityIntegrationService.mapSkillsToDepartment(
                    skills, userProfile.getCurrentRole()
            );
            String seniority = identityIntegrationService.mapExperienceToSeniority(
                    userProfile.getExperienceYears()
            );

            userProfile.setDepartment(department);
            userProfile.setSeniority(seniority);

            long processingTime = System.currentTimeMillis() - startTime;

            return CVAnalysisResult.builder()
                    .fileName(fileName)
                    .success(true)
                    .userProfile(userProfile)
                    .rawAnalysis(cvContent)
                    .confidence(calculateConfidence(userProfile))
                    .processingTime(processingTime)
                    .build();

        } catch (Exception e) {
            log.error("Error parsing CV with regex: {}", e.getMessage(), e);
            return createFallbackAnalysis(fileName);
        }
    }

    private String normalizeText(String text) {
        // Remove excessive whitespace and normalize line breaks
        return text.replaceAll("\\s+", " ")
                .replaceAll("\\r\\n", "\n")
                .trim();
    }

    private String extractEmail(String content) {
        Matcher matcher = EMAIL_PATTERN.matcher(content);
        if (matcher.find()) {
            return matcher.group().toLowerCase();
        }
        return null;
    }

    private String extractPhone(String content) {
        Matcher matcher = PHONE_PATTERN.matcher(content);
        if (matcher.find()) {
            return matcher.group().replaceAll("\\s+", "");
        }
        return null;
    }

    private String extractLinkedIn(String content) {
        Matcher matcher = LINKEDIN_PATTERN.matcher(content);
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }

    private String extractGitHub(String content) {
        Matcher matcher = GITHUB_PATTERN.matcher(content);
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }

    private String extractName(String content) {
        // Name is usually at the beginning, before email
        String[] lines = content.split("\n");

        for (int i = 0; i < Math.min(5, lines.length); i++) {
            String line = lines[i].trim();

            // Skip lines with email or phone
            if (EMAIL_PATTERN.matcher(line).find() || PHONE_PATTERN.matcher(line).find()) {
                continue;
            }

            // Name is typically 2-4 words, capitalized
            if (line.matches("^[A-Z][a-z]+(\\s+[A-Z][a-z]+){1,3}$")) {
                return line;
            }
        }

        // Fallback: look for pattern like "Name: John Doe"
        Pattern namePattern = Pattern.compile("(?:Name|Full Name|Tên)\\s*:?\\s*([A-Z][a-z]+(\\s+[A-Z][a-z]+)+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = namePattern.matcher(content);
        if (matcher.find()) {
            return matcher.group(1);
        }

        return "Unknown";
    }

    private String extractLocation(String content) {
        // Common location patterns
        Pattern locationPattern = Pattern.compile(
                "(?:Address|Location|City|Địa chỉ)\\s*:?\\s*([^\\n,]+(?:,\\s*[^\\n,]+)?)",
                Pattern.CASE_INSENSITIVE
        );

        Matcher matcher = locationPattern.matcher(content);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }

        // Look for common city names
        String[] cities = {"Ho Chi Minh", "Hanoi", "Da Nang", "New York", "San Francisco", "London", "Singapore"};
        for (String city : cities) {
            if (content.contains(city)) {
                return city;
            }
        }

        return null;
    }

    private Map<String, Double> extractSkills(String content) {
        Map<String, Double> skills = new HashMap<>();
        String lowerContent = content.toLowerCase();

        // Extract from skills section
        String skillsSection = extractSection(content,
                new String[]{"skills", "technical skills", "kỹ năng"},
                new String[]{"experience", "work", "education", "kinh nghiệm"}
        );

        if (skillsSection != null) {
            lowerContent = skillsSection.toLowerCase();
        }

        // Match against skill keywords
        for (Map.Entry<String, String> entry : SKILL_KEYWORDS.entrySet()) {
            String skill = entry.getKey();
            if (lowerContent.contains(skill.toLowerCase())) {
                // Calculate proficiency based on context
                double proficiency = estimateSkillProficiency(content, skill);
                skills.put(capitalizeSkillName(skill), proficiency);
            }
        }

        return skills;
    }

    private Map<String, String> extractSkillTypes(String content) {
        Map<String, String> skillTypes = new HashMap<>();
        String lowerContent = content.toLowerCase();

        for (Map.Entry<String, String> entry : SKILL_KEYWORDS.entrySet()) {
            String skill = entry.getKey();
            String type = entry.getValue();

            if (lowerContent.contains(skill.toLowerCase())) {
                skillTypes.put(capitalizeSkillName(skill), type);
            }
        }

        return skillTypes;
    }

    private double estimateSkillProficiency(String content, String skill) {
        String lowerContent = content.toLowerCase();
        String lowerSkill = skill.toLowerCase();

        // Check for proficiency indicators
        if (lowerContent.contains(lowerSkill + " expert") ||
                lowerContent.contains("expert in " + lowerSkill) ||
                lowerContent.contains(lowerSkill + " master")) {
            return 0.9;
        }

        if (lowerContent.contains(lowerSkill + " advanced") ||
                lowerContent.contains("proficient in " + lowerSkill)) {
            return 0.8;
        }

        if (lowerContent.contains(lowerSkill + " intermediate") ||
                lowerContent.contains("experience with " + lowerSkill)) {
            return 0.6;
        }

        if (lowerContent.contains(lowerSkill + " beginner") ||
                lowerContent.contains(lowerSkill + " basic")) {
            return 0.3;
        }

        // Default to intermediate if mentioned
        return 0.5;
    }

    private Map<String, Integer> estimateSkillExperience(String content) {
        Map<String, Integer> skillExperience = new HashMap<>();

        // Pattern to match "X years of Skill" or "Skill (X years)"
        Pattern yearsPattern = Pattern.compile(
                "(\\d+)\\+?\\s*(?:years?|yrs?)\\s+(?:of\\s+)?([\\w\\s.#+]+)|([\\w\\s.#+]+)\\s*\\((\\d+)\\+?\\s*(?:years?|yrs?)\\)",
                Pattern.CASE_INSENSITIVE
        );

        Matcher matcher = yearsPattern.matcher(content);
        while (matcher.find()) {
            String years = matcher.group(1) != null ? matcher.group(1) : matcher.group(4);
            String skill = matcher.group(2) != null ? matcher.group(2) : matcher.group(3);

            if (years != null && skill != null) {
                skill = skill.trim();
                if (SKILL_KEYWORDS.containsKey(skill.toLowerCase())) {
                    skillExperience.put(capitalizeSkillName(skill), Integer.parseInt(years));
                }
            }
        }

        return skillExperience;
    }

    private List<String> identifyMandatorySkills(String content) {
        List<String> mandatorySkills = new ArrayList<>();

        // Core programming languages and frameworks mentioned multiple times are mandatory
        Map<String, Integer> skillMentions = new HashMap<>();
        String lowerContent = content.toLowerCase();

        for (String skill : SKILL_KEYWORDS.keySet()) {
            int count = countOccurrences(lowerContent, skill.toLowerCase());
            if (count > 0) {
                skillMentions.put(skill, count);
            }
        }

        // Skills mentioned 3+ times or in job titles are mandatory
        for (Map.Entry<String, Integer> entry : skillMentions.entrySet()) {
            if (entry.getValue() >= 3) {
                mandatorySkills.add(capitalizeSkillName(entry.getKey()));
            }
        }

        return mandatorySkills;
    }

    private List<Map<String, Object>> extractWorkExperience(String content) {
        List<Map<String, Object>> workHistory = new ArrayList<>();

        String experienceSection = extractSection(content,
                new String[]{"experience", "work experience", "employment", "kinh nghiệm"},
                new String[]{"education", "skills", "projects", "học vấn"}
        );

        if (experienceSection == null) {
            return workHistory;
        }

        // Split by common job entry patterns
        String[] entries = experienceSection.split("(?=\\n[A-Z][\\w\\s]+(?:Engineer|Developer|Manager|Analyst|Designer|Lead))");

        for (String entry : entries) {
            if (entry.trim().isEmpty()) continue;

            Map<String, Object> experience = new HashMap<>();

            // Extract position (first line)
            String[] lines = entry.split("\n");
            if (lines.length > 0) {
                experience.put("position", lines[0].trim());
            }

            // Extract company
            Pattern companyPattern = Pattern.compile("(?:at\\s+|@\\s+)?([A-Z][\\w\\s&.,]+(?:Inc|Ltd|Corp|Company)?)", Pattern.CASE_INSENSITIVE);
            Matcher companyMatcher = companyPattern.matcher(entry);
            if (companyMatcher.find()) {
                experience.put("company", companyMatcher.group(1).trim());
            }

            // Extract dates
            List<String> dates = extractDates(entry);
            if (dates.size() >= 2) {
                experience.put("startDate", dates.get(0));
                experience.put("endDate", dates.get(1));
                experience.put("duration", calculateDuration(dates.get(0), dates.get(1)));
            } else if (dates.size() == 1) {
                experience.put("startDate", dates.get(0));
                experience.put("endDate", "Present");
                experience.put("duration", calculateDuration(dates.get(0), "Present"));
            }

            // Extract responsibilities (bullet points or numbered lists)
            List<String> responsibilities = extractBulletPoints(entry);
            experience.put("responsibilities", responsibilities);

            // Extract technologies mentioned
            List<String> technologies = new ArrayList<>();
            for (String skill : SKILL_KEYWORDS.keySet()) {
                if (entry.toLowerCase().contains(skill.toLowerCase())) {
                    technologies.add(capitalizeSkillName(skill));
                }
            }
            experience.put("technologies", technologies);

            workHistory.add(experience);
        }

        return workHistory;
    }

    private List<Map<String, Object>> extractEducation(String content) {
        List<Map<String, Object>> education = new ArrayList<>();

        String educationSection = extractSection(content,
                new String[]{"education", "academic", "học vấn"},
                new String[]{"experience", "skills", "projects"}
        );

        if (educationSection == null) {
            return education;
        }

        // Pattern for degree
        Pattern degreePattern = Pattern.compile(
                "(Bachelor|Master|PhD|B\\.?S\\.?|M\\.?S\\.?|B\\.?A\\.?|M\\.?A\\.)\\s+(?:of\\s+|in\\s+)?([\\w\\s]+)",
                Pattern.CASE_INSENSITIVE
        );

        String[] entries = educationSection.split("\n\n");

        for (String entry : entries) {
            Map<String, Object> edu = new HashMap<>();

            // Extract degree
            Matcher degreeMatcher = degreePattern.matcher(entry);
            if (degreeMatcher.find()) {
                edu.put("degree", degreeMatcher.group(0).trim());
                edu.put("field", degreeMatcher.group(2).trim());
            }

            // Extract institution
            String[] lines = entry.split("\n");
            for (String line : lines) {
                if (line.matches(".*(?:University|College|Institute|School).*")) {
                    edu.put("institution", line.trim());
                    break;
                }
            }

            // Extract graduation year
            Pattern yearPattern = Pattern.compile("\\b(19|20)\\d{2}\\b");
            Matcher yearMatcher = yearPattern.matcher(entry);
            if (yearMatcher.find()) {
                edu.put("graduationYear", Integer.parseInt(yearMatcher.group()));
            }

            // Extract GPA
            Pattern gpaPattern = Pattern.compile("GPA\\s*:?\\s*(\\d\\.\\d+)(?:/\\d\\.\\d+)?", Pattern.CASE_INSENSITIVE);
            Matcher gpaMatcher = gpaPattern.matcher(entry);
            if (gpaMatcher.find()) {
                edu.put("gpa", gpaMatcher.group(1));
            }

            if (!edu.isEmpty()) {
                education.add(edu);
            }
        }

        return education;
    }

    private List<String> extractCertifications(String content) {
        List<String> certifications = new ArrayList<>();

        String certSection = extractSection(content,
                new String[]{"certification", "certificates", "chứng chỉ"},
                new String[]{"education", "skills", "projects"}
        );

        if (certSection != null) {
            List<String> bullets = extractBulletPoints(certSection);
            certifications.addAll(bullets);
        }

        // Common certification patterns
        Pattern certPattern = Pattern.compile(
                "(?:AWS|Azure|GCP|Oracle|Microsoft|Cisco|CompTIA)\\s+(?:Certified)?\\s+[\\w\\s-]+",
                Pattern.CASE_INSENSITIVE
        );

        Matcher matcher = certPattern.matcher(content);
        while (matcher.find()) {
            String cert = matcher.group().trim();
            if (!certifications.contains(cert)) {
                certifications.add(cert);
            }
        }

        return certifications;
    }

    private List<Map<String, Object>> extractCertificationDetails(String content) {
        List<Map<String, Object>> details = new ArrayList<>();
        List<String> certs = extractCertifications(content);

        for (String cert : certs) {
            Map<String, Object> detail = new HashMap<>();
            detail.put("name", cert);

            // Try to find issuer
            if (cert.toLowerCase().contains("aws")) detail.put("issuer", "Amazon Web Services");
            else if (cert.toLowerCase().contains("azure")) detail.put("issuer", "Microsoft");
            else if (cert.toLowerCase().contains("gcp")) detail.put("issuer", "Google Cloud");
            else if (cert.toLowerCase().contains("oracle")) detail.put("issuer", "Oracle");

            details.add(detail);
        }

        return details;
    }

    private List<Map<String, Object>> extractProjects(String content) {
        List<Map<String, Object>> projects = new ArrayList<>();

        String projectSection = extractSection(content,
                new String[]{"projects", "personal projects", "dự án"},
                new String[]{"education", "skills", "experience"}
        );

        if (projectSection == null) {
            return projects;
        }

        String[] entries = projectSection.split("\n\n");

        for (String entry : entries) {
            Map<String, Object> project = new HashMap<>();

            String[] lines = entry.split("\n");
            if (lines.length > 0) {
                project.put("name", lines[0].trim());
            }

            if (lines.length > 1) {
                project.put("description", lines[1].trim());
            }

            // Extract technologies
            List<String> technologies = new ArrayList<>();
            for (String skill : SKILL_KEYWORDS.keySet()) {
                if (entry.toLowerCase().contains(skill.toLowerCase())) {
                    technologies.add(capitalizeSkillName(skill));
                }
            }
            project.put("technologies", technologies);

            if (!project.isEmpty()) {
                projects.add(project);
            }
        }

        return projects;
    }

    private Map<String, String> extractLanguages(String content) {
        Map<String, String> languages = new HashMap<>();

        // Common languages
        String[] commonLanguages = {"English", "Vietnamese", "Chinese", "Japanese", "French", "German", "Spanish"};
        String[] proficiencyLevels = {"NATIVE", "FLUENT", "CONVERSATIONAL", "BASIC"};

        for (String language : commonLanguages) {
            if (content.toLowerCase().contains(language.toLowerCase())) {
                // Try to find proficiency level nearby
                String proficiency = "CONVERSATIONAL"; // default

                for (String level : proficiencyLevels) {
                    Pattern pattern = Pattern.compile(
                            language + "\\s*[:-]?\\s*" + level,
                            Pattern.CASE_INSENSITIVE
                    );
                    if (pattern.matcher(content).find()) {
                        proficiency = level;
                        break;
                    }
                }

                languages.put(language, proficiency);
            }
        }

        return languages;
    }

    private double calculateTotalExperience(String content) {
        List<Map<String, Object>> workHistory = extractWorkExperience(content);

        if (workHistory.isEmpty()) {
            // Try to extract from text like "5 years of experience"
            Pattern expPattern = Pattern.compile("(\\d+)\\+?\\s*(?:years?|yrs?)\\s+(?:of\\s+)?experience", Pattern.CASE_INSENSITIVE);
            Matcher matcher = expPattern.matcher(content);
            if (matcher.find()) {
                return Double.parseDouble(matcher.group(1));
            }
            return 1.0; // default
        }

        // Sum up all durations
        double totalYears = 0.0;
        for (Map<String, Object> work : workHistory) {
            String duration = (String) work.get("duration");
            if (duration != null) {
                totalYears += parseDurationToYears(duration);
            }
        }

        return totalYears > 0 ? totalYears : 1.0;
    }

    private String extractCurrentRole(String content) {
        List<Map<String, Object>> workHistory = extractWorkExperience(content);

        if (!workHistory.isEmpty()) {
            Map<String, Object> currentJob = workHistory.get(0);
            return (String) currentJob.get("position");
        }

        // Look for common role patterns at the beginning
        String[] lines = content.split("\n");
        for (int i = 0; i < Math.min(10, lines.length); i++) {
            String line = lines[i];
            if (line.matches(".*(?:Engineer|Developer|Manager|Analyst|Designer|Lead|Architect).*")) {
                return line.trim();
            }
        }

        return "Software Developer"; // default
    }

    // Helper methods

    private String extractSection(String content, String[] startKeywords, String[] endKeywords) {
        String lowerContent = content.toLowerCase();

        int startIndex = -1;
        for (String keyword : startKeywords) {
            int index = lowerContent.indexOf(keyword.toLowerCase());
            if (index != -1 && (startIndex == -1 || index < startIndex)) {
                startIndex = index;
            }
        }

        if (startIndex == -1) return null;

        int endIndex = content.length();
        for (String keyword : endKeywords) {
            int index = lowerContent.indexOf(keyword.toLowerCase(), startIndex + 1);
            if (index != -1 && index < endIndex) {
                endIndex = index;
            }
        }

        return content.substring(startIndex, endIndex);
    }

    private List<String> extractBulletPoints(String text) {
        List<String> bullets = new ArrayList<>();

        // Match bullet points: -, •, *, or numbers like 1., 2.
        Pattern bulletPattern = Pattern.compile("^\\s*[-•*]\\s+(.+)$|^\\s*\\d+\\.\\s+(.+)$", Pattern.MULTILINE);
        Matcher matcher = bulletPattern.matcher(text);

        while (matcher.find()) {
            String bullet = matcher.group(1) != null ? matcher.group(1) : matcher.group(2);
            if (bullet != null && !bullet.trim().isEmpty()) {
                bullets.add(bullet.trim());
            }
        }

        return bullets;
    }

    private List<String> extractDates(String text) {
        List<String> dates = new ArrayList<>();
        Matcher matcher = DATE_PATTERN.matcher(text);

        while (matcher.find()) {
            dates.add(matcher.group());
        }

        return dates;
    }

    private String calculateDuration(String startDate, String endDate) {
        try {
            int startYear = extractYear(startDate);
            int endYear = endDate.equalsIgnoreCase("Present") ?
                    LocalDate.now().getYear() : extractYear(endDate);

            int years = endYear - startYear;

            if (years == 0) return "Less than 1 year";
            if (years == 1) return "1 year";
            return years + " years";

        } catch (Exception e) {
            return "Unknown";
        }
    }

    private int extractYear(String dateStr) {
        Pattern yearPattern = Pattern.compile("\\b(19|20)\\d{2}\\b");
        Matcher matcher = yearPattern.matcher(dateStr);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group());
        }
        return LocalDate.now().getYear();
    }

    private double parseDurationToYears(String duration) {
        Pattern pattern = Pattern.compile("(\\d+)\\s*(?:years?|yrs?)");
        Matcher matcher = pattern.matcher(duration.toLowerCase());

        if (matcher.find()) {
            return Double.parseDouble(matcher.group(1));
        }

        return 0.5; // default to 6 months
    }

    private String capitalizeSkillName(String skill) {
        if (skill.length() <= 3) {
            return skill.toUpperCase(); // Acronyms like AWS, GCP
        }
        return Arrays.stream(skill.split("\\s+"))
                .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
    }

    private int countOccurrences(String text, String pattern) {
        int count = 0;
        int index = 0;
        while ((index = text.indexOf(pattern, index)) != -1) {
            count++;
            index += pattern.length();
        }
        return count;
    }

    private double calculateConfidence(ParsedUserProfile profile) {
        int score = 0;
        int maxScore = 10;

        if (profile.getName() != null && !profile.getName().equals("Unknown")) score++;
        if (profile.getEmail() != null) score++;
        if (profile.getPhone() != null) score++;
        if (profile.getSkills() != null && !profile.getSkills().isEmpty()) score += 2;
        if (profile.getWorkHistory() != null && !profile.getWorkHistory().isEmpty()) score += 2;
        if (profile.getEducation() != null && !profile.getEducation().isEmpty()) score++;
        if (profile.getExperienceYears() > 0) score++;
        if (profile.getCurrentRole() != null) score++;

        return (double) score / maxScore;
    }

    private CVAnalysisResult createFallbackAnalysis(String fileName) {
        log.warn("Creating fallback analysis for: {}", fileName);

        ParsedUserProfile fallbackProfile = ParsedUserProfile.builder()
                .name("Unknown")
                .email(null)
                .phone(null)
                .skills(new HashMap<>())
                .skillTypes(new HashMap<>())
                .workHistory(new ArrayList<>())
                .education(new ArrayList<>())
                .certifications(new ArrayList<>())
                .projects(new ArrayList<>())
                .languages(new HashMap<>())
                .experienceYears(1.0)
                .currentRole("Unknown")
                .estimatedProductivity(0.5)
                .adaptabilityScore(0.5)
                .leadershipPotential(0.5)
                .technicalComplexityHandling(0.5)
                .collaborationScore(0.5)
                .build();

        return CVAnalysisResult.builder()
                .fileName(fileName)
                .success(false)
                .userProfile(fallbackProfile)
                .rawAnalysis("")
                .confidence(0.0)
                .processingTime(0L)
                .build();
    }
}

