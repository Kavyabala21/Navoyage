using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CoreModels.Entities
{
    [Table("tbl_User")]
    public class User
    {
        // Primary Key

        [Key]
        public int UserId { get; set; }


        // User Identity Details

        [Required, StringLength(150)]
        public string FullName { get; set; } = null!;

        [Required, StringLength(150), EmailAddress]
        public string Email { get; set; } = null!;

        [Required, StringLength(20)]
        [RegularExpression(@"^\+\d{1,3}-\d{6,15}$")]
        public string PhoneNumber { get; set; } = null!;

        [Required, StringLength(200)]
        public string Password { get; set; } = null!;


        // Role & Status

        [Required, StringLength(20)]
        [RegularExpression(@"^(Admin|TravelCompanyOwner|Customer)$")]
        public string Role { get; set; } = "Customer";

        [Required]
        public bool IsActive { get; set; } = true;


        // Audit Fields

        [Required]
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow.AddHours(5.5);

        public DateTime? ModifiedOn { get; set; }

        public int? ModifiedBy { get; set; }


        // Navigation Properties

        [JsonIgnore]
        public virtual ICollection<TravelCompany>? TravelCompany { get; set; }

        [JsonIgnore]
        public virtual ICollection<VehicleDocument>? VehicleDocument { get; set; }

        [JsonIgnore]
        public virtual ICollection<Booking>? Booking { get; set; }

        [JsonIgnore]
        public virtual ICollection<Review>? Review { get; set; }


        // Login Model (Request Only)

        public class LoginModel
        {
            public string? LoginIdentifier { get; set; }
            public string? PhoneNumber { get; set; }
            public string? UserName { get; set; }
            public string? UserEmail { get; set; }
            public string? Email { get; set; }

            [Required]
            public string Password { get; set; } = string.Empty;
        }
    }
}
