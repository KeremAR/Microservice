using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IssueService.Models;

public class Issue
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    public string Title { get; set; }
    public string Description { get; set; }
    public string Category { get; set; }
    public string PhotoUrl { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string UserId { get; set; }
}
