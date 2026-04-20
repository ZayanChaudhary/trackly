export const getRankImage = (filename: string) => {

    const images: Record<string, any> = {
        'r1.png': require('../../assets/icons/trackly_ranks/r1.png'),
        'r2.png': require('../../assets/icons/trackly_ranks/r2.png'),
        'r3.png': require('../../assets/icons/trackly_ranks/r3.png'),
        'r4.png': require('../../assets/icons/trackly_ranks/r4.png'),
        'r5.png': require('../../assets/icons/trackly_ranks/r5.png'),
        'r6.png': require('../../assets/icons/trackly_ranks/r6.png'),
        'r7.png': require('../../assets/icons/trackly_ranks/r7.png'),
        'r8.png': require('../../assets/icons/trackly_ranks/r8.png'),
        'r9.png': require('../../assets/icons/trackly_ranks/r9.png'),
        'r10.png': require('../../assets/icons/trackly_ranks/r10.png'),
        'r11.png': require('../../assets/icons/trackly_ranks/r11.png'),
        'r12.png': require('../../assets/icons/trackly_ranks/r12.png'),
        'r13.png': require('../../assets/icons/trackly_ranks/r13.png'),
        'r14.png': require('../../assets/icons/trackly_ranks/r14.png'),
    };

    return images[filename] || images['r1.png'];
};

