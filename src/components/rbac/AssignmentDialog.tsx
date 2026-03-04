import "./AssignmentDialog.css";

interface AssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  description: string;
  onDescriptionChange: (value: string) => void;
}

const AssignmentDialog = ({
  open,
  onClose,
  onSubmit,
  description,
  onDescriptionChange,
}: AssignmentDialogProps) => {
  if (!open) return null;

  return (
    <div className="ad-modal-overlay" onClick={onClose}>
      <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ad-modal-header">
          <h2 className="ad-modal-title">Create New Assignment</h2>
          <button
            className="ad-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6 6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="ad-modal-body">
          <label className="ad-modal-label" htmlFor="ad-desc">
            Description
          </label>
          <textarea
            id="ad-desc"
            className="ad-modal-textarea"
            placeholder="Enter assignment description..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={4}
          />
        </div>

        <div className="ad-modal-footer">
          <button className="ad-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="ad-modal-create" onClick={onSubmit}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDialog;
