using Xunit;
using Moq;
using FluentAssertions;
using IssueService.Controllers;
using IssueService.Services.Interfaces;
using IssueService.DTOs;
using IssueService.Domain.IssueAggregate;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace IssueService.Tests.Controllers
{
    public class IssueControllerTests
    {
        private readonly Mock<IIssueService> _mockIssueService;
        private readonly IssueController _controller;

        public IssueControllerTests()
        {
            _mockIssueService = new Mock<IIssueService>();
            _controller = new IssueController(_mockIssueService.Object);
        }

        [Fact]
        public async Task Report_ValidRequest_ReturnsOkResult()
        {
            // Arrange
            var request = new CreateIssueRequest
            {
                Title = "Test Issue",
                Description = "Test Description",
                Category = "Test Category",
                PhotoUrl = "http://test.com/photo.jpg",
                UserId = "user123",
                DepartmentId = "dept123"
            };

            var expectedResponse = new IssueResponse
            {
                Id = "issue123",
                Title = request.Title,
                Description = request.Description,
                Category = request.Category,
                PhotoUrl = request.PhotoUrl,
                UserId = request.UserId,
                DepartmentId = request.DepartmentId,
                Status = IssueStatus.Pending.ToString()
            };

            _mockIssueService
                .Setup(x => x.ReportIssueAsync(request))
                .Returns(Task.FromResult(expectedResponse));

            // Act
            var result = await _controller.Report(request);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(expectedResponse);
        }

        [Fact]
        public async Task GetIssue_ExistingIssue_ReturnsOkResult()
        {
            // Arrange
            var issueId = "issue123";
            var expectedResponse = new IssueResponse
            {
                Id = issueId,
                Title = "Test Issue",
                Description = "Test Description",
                Category = "Test Category",
                Status = IssueStatus.Pending.ToString()
            };

            _mockIssueService
                .Setup(x => x.GetIssueByIdAsync(issueId))
                .Returns(Task.FromResult(expectedResponse));

            // Act
            var result = await _controller.GetIssue(issueId);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(expectedResponse);
        }

        [Fact]
        public async Task GetIssue_NonExistingIssue_ReturnsNotFound()
        {
            // Arrange
            var issueId = "nonexistent";
            _mockIssueService
                .Setup(x => x.GetIssueByIdAsync(issueId))
                .Returns(Task.FromResult<IssueResponse>(null));

            // Act
            var result = await _controller.GetIssue(issueId);

            // Assert
            result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task UpdateStatus_ValidStatus_ReturnsNoContent()
        {
            // Arrange
            var issueId = "issue123";
            var newStatus = IssueStatus.Resolved.ToString();

            _mockIssueService
                .Setup(x => x.UpdateIssueStatusAsync(issueId, IssueStatus.Resolved))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.UpdateStatus(issueId, newStatus);

            // Assert
            result.Should().BeOfType<NoContentResult>();
            _mockIssueService.Verify(x => x.UpdateIssueStatusAsync(issueId, IssueStatus.Resolved), Times.Once);
        }

        [Fact]
        public async Task UpdateStatus_InvalidStatus_ReturnsBadRequest()
        {
            // Arrange
            var issueId = "issue123";
            var invalidStatus = "InvalidStatus";

            // Act
            var result = await _controller.UpdateStatus(issueId, invalidStatus);

            // Assert
            var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequestResult.Value.Should().BeOfType<string>()
                .Which.Should().Contain("Invalid status value");
        }
    }
} 