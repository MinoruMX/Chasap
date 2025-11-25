import Campaign from "../../models/Campaign";
import AppError from "../../errors/AppError";

const DeleteService = async (id: string): Promise<void> => {
  const record = await Campaign.findOne({
    where: { id }
  });

  if (!record) {
    throw new AppError("ERR_NO_CAMPAIGN_FOUND", 404);
  }

  if (record.status === "EM_ANDAMENTO") {
    throw new AppError("No se puede eliminar una campaña en curso", 400);
  }

  await record.destroy();
};

export default DeleteService;
