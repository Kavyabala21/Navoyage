using CoreModels.Entities;

namespace ApplicationLayer.Interfaces
{
    public interface IVehicleDocumentRepository
    {
        List<VehicleDocument> GetAllDocuments();
        List<VehicleDocument> GetDocumentsByVehicleId(int vehicleId);
        VehicleDocument? GetDocumentById(int documentId);

        Task<VehicleDocument> AddDocument(VehicleDocument document);
        void UpdateDocument(VehicleDocument document);
        void DeleteDocument(int documentId);
    }
}
