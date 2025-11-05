const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkVideos() {
  try {
    console.log('Checking videos in database...\n');
    
    // Get all videos
    const allVideos = await prisma.recentEventVideo.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`Total videos: ${allVideos.length}\n`);
    
    if (allVideos.length === 0) {
      console.log('❌ No videos found in database.');
      console.log('   Create videos through the dashboard at /dashboard/videos');
      return;
    }
    
    // Get published videos
    const publishedVideos = allVideos.filter(v => v.isPublished);
    console.log(`Published videos: ${publishedVideos.length}`);
    console.log(`Unpublished videos: ${allVideos.length - publishedVideos.length}\n`);
    
    if (publishedVideos.length === 0) {
      console.log('⚠️  No published videos found!');
      console.log('   Publish videos through the dashboard at /dashboard/videos\n');
    }
    
    // Show details
    console.log('Video Details:');
    console.log('─'.repeat(80));
    allVideos.forEach((video, index) => {
      console.log(`\n${index + 1}. ${video.title}`);
      console.log(`   ID: ${video.id}`);
      console.log(`   Published: ${video.isPublished ? '✅ Yes' : '❌ No'}`);
      console.log(`   URL: ${video.videoUrl}`);
      console.log(`   Type: ${video.videoType}`);
      console.log(`   Sort Order: ${video.sortOrder}`);
      console.log(`   Created: ${video.createdAt.toISOString()}`);
      
      // Check if URL is valid
      const isValidUrl = video.videoUrl && 
        typeof video.videoUrl === 'string' &&
        video.videoUrl.trim() !== '';
      
      if (!isValidUrl) {
        console.log(`   ⚠️  URL is invalid or empty!`);
      } else if (!video.videoUrl.includes('youtube.com') && 
                 !video.videoUrl.includes('youtu.be') && 
                 !video.videoUrl.startsWith('http')) {
        console.log(`   ⚠️  URL might not be accessible (should start with http/https or be YouTube)`);
      }
    });
    
    console.log('\n' + '─'.repeat(80));
    console.log('\nRecommendations:');
    if (publishedVideos.length === 0) {
      console.log('1. Publish videos through the dashboard (/dashboard/videos)');
    }
    if (publishedVideos.length > 0) {
      const invalidUrls = publishedVideos.filter(v => 
        !v.videoUrl || 
        typeof v.videoUrl !== 'string' ||
        v.videoUrl.trim() === ''
      );
      if (invalidUrls.length > 0) {
        console.log(`2. Fix ${invalidUrls.length} video(s) with invalid URLs`);
      }
    }
    console.log('3. Ensure video URLs are valid (YouTube links or direct video file URLs)');
    
  } catch (error) {
    console.error('Error checking videos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVideos();

