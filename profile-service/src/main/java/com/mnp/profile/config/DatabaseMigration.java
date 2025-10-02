package com.mnp.profile.config;

import org.neo4j.driver.Driver;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigration implements CommandLineRunner {

    private final Driver driver;

    @Override
    public void run(String... args) throws Exception {
        try (var session = driver.session()) {
            // Add avatar property to existing UserProfile nodes if it doesn't exist
            String query =
                    """
				MATCH (up:user_profile)
				WHERE up.avatar IS NULL
				SET up.avatar = null
				RETURN count(up) as updated
				""";

            var result = session.run(query);
            if (result.hasNext()) {
                var record = result.next();
                int updated = record.get("updated").asInt();
                log.info("Updated {} UserProfile nodes with avatar property", updated);
            }

            // Ensure all required properties exist
            String ensurePropertiesQuery =
                    """
				MATCH (up:user_profile)
				SET up.avatar = COALESCE(up.avatar, null),
					up.dob = COALESCE(up.dob, null),
					up.city = COALESCE(up.city, null),
					up.averageTaskCompletionRate = COALESCE(up.averageTaskCompletionRate, 0.0),
					up.totalTasksCompleted = COALESCE(up.totalTasksCompleted, 0),
					up.currentWorkLoadHours = COALESCE(up.currentWorkLoadHours, 0),
					up.availabilityStatus = COALESCE(up.availabilityStatus, 'AVAILABLE')
				RETURN count(up) as ensured
				""";

            var ensureResult = session.run(ensurePropertiesQuery);
            if (ensureResult.hasNext()) {
                var record = ensureResult.next();
                int ensured = record.get("ensured").asInt();
                log.info("Ensured properties exist for {} UserProfile nodes", ensured);
            }

            // Create sample skills for existing profiles that don't have skills
            createSampleSkills();

        } catch (Exception e) {
            log.error("Error during database migration: {}", e.getMessage());
        }
    }

    private void createSampleSkills() {
        try (var session = driver.session()) {
            // Create sample skills for admin user if they don't exist
            String createSkillsQuery =
                    """
				MATCH (up:user_profile {userId: '96398896-4080-427a-8a11-f4a5cbc3815d'})
				WHERE NOT EXISTS {
					MATCH (up)-[:HAS_SKILL]->(:user_skill)
				}
				CREATE (skill1:user_skill {
					id: randomUUID(),
					skillName: 'Java',
					skillType: 'TECHNICAL',
					proficiencyLevel: 'EXPERT',
					yearsOfExperience: 5,
					lastUsed: date('2025-09-20')
				}),
				(skill2:user_skill {
					id: randomUUID(),
					skillName: 'Spring Boot',
					skillType: 'TECHNICAL',
					proficiencyLevel: 'EXPERT',
					yearsOfExperience: 4,
					lastUsed: date('2025-09-23')
				}),
				(skill3:user_skill {
					id: randomUUID(),
					skillName: 'System Administration',
					skillType: 'TECHNICAL',
					proficiencyLevel: 'EXPERT',
					yearsOfExperience: 8,
					lastUsed: date('2025-09-24')
				}),
				(skill4:user_skill {
					id: randomUUID(),
					skillName: 'Leadership',
					skillType: 'SOFT',
					proficiencyLevel: 'ADVANCED',
					yearsOfExperience: 6,
					lastUsed: date('2025-09-22')
				}),
				(up)-[:HAS_SKILL]->(skill1),
				(up)-[:HAS_SKILL]->(skill2),
				(up)-[:HAS_SKILL]->(skill3),
				(up)-[:HAS_SKILL]->(skill4)
				RETURN count(skill1) as created
				""";

            var skillResult = session.run(createSkillsQuery);
            if (skillResult.hasNext()) {
                var record = skillResult.next();
                int created = record.get("created").asInt();
                if (created > 0) {
                    log.info("Created {} sample skills for admin user", created * 4);
                }
            }

        } catch (Exception e) {
            log.error("Error creating sample skills: {}", e.getMessage());
        }
    }
}
