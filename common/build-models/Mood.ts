enum Mood {
    Neg2 = -2,
    Neg1 = -1,
    Neutral = 0,
    Plus1 = 1,
    Plus2 = 2
}

export function toString(mood: Mood) {
    switch (mood) {
        case Mood.Neg2:
            return {
                name: 'Demoralized',
                description: 'You feel like you are stuck in a project with little progress, and unable to make significant contributions'
            }
        case Mood.Neg1:
            return {
                name: 'Concerned',
                description: "You may feel anxious, worried or nervous about the project's progress, deadlines, or your own ability to meet expectations"
            }
        case Mood.Neutral:
            return {
                name: 'Neutral',
                description: 'You may not have particlarly positive or negative feelings about the project, but feel that you are making distinct progress'
            }
        case Mood.Plus1:
            return {
                name: 'Motivated',
                description: 'You feel optimistic and motivated about the project, perhaps because you are making progress or achieving milestones'
            }
        case Mood.Plus2:
            return {
                name: 'Enthusiastic',
                description: 'You feel enthusiastic and energized about the project, perhaps because you have accomplished something significant or are working on an exciting new feature'
            }
        }
    return { name: '', description: ''}    
}

export const BAD_MOOD = -0.5;
export const VERY_BAD_MOOD = -1;
export default Mood;