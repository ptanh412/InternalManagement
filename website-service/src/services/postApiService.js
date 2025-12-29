import api from './apiService';

const POST_SERVICE_URL = '/post'; // Relative path since api already has baseURL

class PostApiService {
  // ==================== POST ENDPOINTS ====================
  
  /**
   * Create a new post
   * @param {Object} postData - { content, departmentId, imageUrls, fileUrls }
   * @returns {Promise} Created post response
   */
  async createPost(postData) {
    try {
      const response = await api.post(`${POST_SERVICE_URL}/create`, postData);
      return response; // Interceptor already returns response.data
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Update an existing post
   * @param {string} postId 
   * @param {Object} postData - { content, departmentId, imageUrls, fileUrls }
   * @returns {Promise} Updated post response
   */
  async updatePost(postId, postData) {
    try {
      const response = await api.put(`${POST_SERVICE_URL}/${postId}`, postData);
      return response; // Interceptor already returns response.data
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  /**
   * Delete a post
   * @param {string} postId 
   * @returns {Promise}
   */
  async deletePost(postId) {
    try {
      const response = await api.delete(`${POST_SERVICE_URL}/${postId}`);
      return response; // Interceptor already returns response.data
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  /**
   * Get current user's posts
   * @param {number} page - Page number (default: 1)
   * @param {number} size - Page size (default: 10)
   * @returns {Promise} Paginated posts
   */
  async getMyPosts(page = 1, size = 10) {
    try {
      const response = await api.get(`${POST_SERVICE_URL}/my-posts`, {
        params: { page, size }
      });
      return response; // Interceptor already returns response.data
    } catch (error) {
      console.error('Error fetching my posts:', error);
      throw error;
    }
  }

  /**
   * Get posts by department
   * @param {string} departmentId 
   * @param {number} page - Page number (default: 1)
   * @param {number} size - Page size (default: 10)
   * @returns {Promise} Paginated posts for department
   */
  async getDepartmentPosts(departmentId, page = 1, size = 10) {
    try {
      const response = await api.get(`${POST_SERVICE_URL}/department/${departmentId}`, {
        params: { page, size }
      });
      return response; // Interceptor already returns response.data
    } catch (error) {
      console.error('Error fetching department posts:', error);
      throw error;
    }
  }

  // ==================== COMMENT ENDPOINTS ====================

  /**
   * Create a new comment
   * @param {Object} commentData - { postId, content, parentCommentId }
   * @returns {Promise} Created comment response
   */
  async createComment(commentData) {
    try {
      const response = await api.post(`${POST_SERVICE_URL}/comments`, commentData);
      return response; // Interceptor already returns response.data
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Update a comment
   * @param {string} commentId 
   * @param {Object} commentData - { content }
   * @returns {Promise} Updated comment response
   */
  async updateComment(commentId, commentData) {
    try {
      const response = await api.put(`${POST_SERVICE_URL}/comments/${commentId}`, commentData);
      return response; // Interceptor already returns response.data
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   * @param {string} commentId 
   * @returns {Promise}
   */
  async deleteComment(commentId) {
    try {
      const response = await api.delete(`${POST_SERVICE_URL}/comments/${commentId}`);
      return response; // Interceptor already returns response.data
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Get comments for a post
   * @param {string} postId 
   * @returns {Promise} List of comments
   */
  async getCommentsByPostId(postId) {
    try {
      const response = await api.get(`${POST_SERVICE_URL}/comments/post/${postId}`);
      return response; // Interceptor already returns response.data
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  // ==================== REACTION ENDPOINTS ====================

  /**
   * Toggle a reaction on a post or comment
   * @param {Object} reactionData - { targetId, targetType, reactionType }
   * @returns {Promise} Reaction response
   */
  async toggleReaction(reactionData) {
    try {
      const response = await api.post(`${POST_SERVICE_URL}/reactions/toggle`, reactionData);
      return response; // Interceptor already returns response.data
    } catch (error) {
      console.error('Error toggling reaction:', error);
      throw error;
    }
  }

  /**
   * Get reactions for a post or comment
   * @param {string} targetId 
   * @returns {Promise} List of reactions
   */
  async getReactionsByTargetId(targetId) {
    try {
      const response = await api.get(`${POST_SERVICE_URL}/reactions/target/${targetId}`);
      return response; // Interceptor already returns response.data
    } catch (error) {
      console.error('Error fetching reactions:', error);
      throw error;
    }
  }
}

export default new PostApiService();
