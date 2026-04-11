import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const API_URL = 'http://localhost:3001/api';

// Test the image search functionality
async function testImageSearch() {
  try {
    console.log('Testing image search functionality...');

    // First, let's check if there are any items
    const itemsResponse = await axios.get(`${API_URL}/items`, {
      headers: {
        // For testing, we'll assume no auth for now
        // In real usage, you'd need to authenticate
      }
    });

    console.log('Current items:', itemsResponse.data.length);

    // Create a simple test image (1x1 red pixel)
    const testImageBuffer = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xC0, 0x00, 0x11,
      0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01,
      0x03, 0x11, 0x01, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x08, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF,
      0xDA, 0x00, 0x0C, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F,
      0x00, 0xFF, 0xD9
    ]);

    // Save test image to file
    fs.writeFileSync('test-image.jpg', testImageBuffer);

    // Test the search endpoint (this will fail without auth, but let's see the error)
    const formData = new FormData();
    formData.append('image', fs.createReadStream('test-image.jpg'), {
      filename: 'test-image.jpg',
      contentType: 'image/jpeg'
    });

    try {
      const searchResponse = await axios.post(`${API_URL}/items/search-image`, formData, {
        headers: {
          ...formData.getHeaders(),
        }
      });

      console.log('Search response:', searchResponse.data);
    } catch (searchError: any) {
      console.log('Search failed (expected without auth):', searchError.response?.status, searchError.response?.data);
    }

    // Clean up
    fs.unlinkSync('test-image.jpg');

  } catch (error: any) {
    console.error('Test failed:', error.message);
  }
}

testImageSearch();