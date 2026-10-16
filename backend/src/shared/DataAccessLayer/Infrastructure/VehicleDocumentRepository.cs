using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Infrastructure
{
   
    public class VehicleDocumentRepository : IVehicleDocumentRepository
    {
        private readonly ApplicationDbContext _context;

        public VehicleDocumentRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public List<VehicleDocument> GetAllDocuments()
        {
            return _context.VehicleDocument
                .Include(v => v.Vehicle)
                .ThenInclude(v => v!.TravelCompany)
                .ToList();
        }

        public List<VehicleDocument> GetDocumentsByVehicleId(int vehicleId)
        {
            return _context.VehicleDocument
                .Include(v => v.Vehicle)
                .ThenInclude(v => v!.TravelCompany)
                .Where(d => d.VehicleId == vehicleId)
                .ToList();
        }

        public VehicleDocument? GetDocumentById(int documentId)
        {
            return _context.VehicleDocument
                .Include(d => d.Vehicle)
                .ThenInclude(v => v!.TravelCompany)
                .FirstOrDefault(d => d.DocumentId == documentId);
        }

     
        public async Task<VehicleDocument> AddDocument(VehicleDocument document)
        {
            await _context.VehicleDocument.AddAsync(document);
           await _context.SaveChangesAsync();
            return document;
        }


        public void UpdateDocument(VehicleDocument document)
        {
            _context.VehicleDocument.Update(document);
            _context.SaveChanges();
        }

        public void DeleteDocument(int documentId)
        {
            var doc = _context.VehicleDocument.Find(documentId);
            if (doc == null) return;

            _context.VehicleDocument.Remove(doc);
            _context.SaveChanges();
        }
    }

}
