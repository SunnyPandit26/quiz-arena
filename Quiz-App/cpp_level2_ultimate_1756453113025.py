
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import json
import sys
import os

try:
    correct = 0
    total = 10
    incorrect = total - correct
    percentage = 0
    
    print(f"🔥 ULTIMATE C++ Level 2 Graph: {correct}/{total} = {percentage}%", file=sys.stderr)
    
    # Force directory creation
    plot_dir = os.path.dirname(r'C:\\Users\\sunny\\OneDrive\\Desktop\\quiz-kro\\quiz-arena\\Quiz-App\\quiz_results\\cpp_level2_ultimate_68b131107120dad9e358d0fa_2025-08-29T07_38_28_252Z_1756453113025.png')
    os.makedirs(plot_dir, mode=0o755, exist_ok=True)
    print(f"ULTIMATE: Plot directory ready: {plot_dir}", file=sys.stderr)
    
    # Create figure with explicit size
    fig = plt.figure(figsize=(12, 5))
    ax1 = fig.add_subplot(121)
    ax2 = fig.add_subplot(122)
    
    # Pie chart
    if incorrect > 0:
        sizes = [correct, incorrect]
        labels = ['Correct', 'Incorrect']  
        colors = ['#4CAF50', '#f44336']
        explode = (0.1, 0)
        ax1.pie(sizes, explode=explode, labels=labels, colors=colors, 
                autopct='%1.0f%%', shadow=True, startangle=90,
                textprops={'fontsize': 12, 'weight': 'bold'})
    else:
        ax1.pie([correct], labels=['Correct'], colors=['#4CAF50'], 
                autopct='%1.0f%%', startangle=90,
                textprops={'fontsize': 12, 'weight': 'bold'})
    
    status = "PASSED ✓" if percentage >= 70 else "FAILED ✗"
    status_color = '#4CAF50' if percentage >= 70 else '#f44336'
    ax1.set_title(f'C++ Level 2 - ULTIMATE\n{status} - {percentage}%', 
                 fontsize=14, fontweight='bold', color=status_color)
    
    # Bar chart
    question_data = [{"questionNumber":1,"question":"Missing Question Data","userAnswer":"Not Answered","correctAnswer":"N/A","isCorrect":False},{"questionNumber":2,"question":"Which of the following correctly declares a pointer in C++?","userAnswer":"Not Answered","correctAnswer":"int *p;","isCorrect":False},{"questionNumber":3,"question":"Missing Question Data","userAnswer":"Not Answered","correctAnswer":"N/A","isCorrect":False},{"questionNumber":4,"question":"Which of the following is not a valid C++ data type?","userAnswer":"Not Answered","correctAnswer":"real","isCorrect":False},{"questionNumber":5,"question":"Missing Question Data","userAnswer":"Not Answered","correctAnswer":"N/A","isCorrect":False},{"questionNumber":6,"question":"Which operator is used to allocate memory dynamically in C++?","userAnswer":"Not Answered","correctAnswer":"new","isCorrect":False},{"questionNumber":7,"question":"Missing Question Data","userAnswer":"Not Answered","correctAnswer":"N/A","isCorrect":False},{"questionNumber":8,"question":"Which of the following is used to define a constant in C++?","userAnswer":"Not Answered","correctAnswer":"both A and B","isCorrect":False},{"questionNumber":9,"question":"Missing Question Data","userAnswer":"Not Answered","correctAnswer":"N/A","isCorrect":False},{"questionNumber":10,"question":"Which of the following correctly creates an object in C++?","userAnswer":"Not Answered","correctAnswer":"Class obj;","isCorrect":False}]
    
    if question_data and len(question_data) > 0:
        all_question_nums = list(range(1, total + 1))
        all_correct_flags = []
        
        existing_data = {}
        for q in question_data:
            existing_data[q['questionNumber']] = q['isCorrect']
        
        for q_num in all_question_nums:
            all_correct_flags.append(existing_data.get(q_num, False))
        
        colors_bar = ['#4CAF50' if correct else '#f44336' for correct in all_correct_flags]
        bars = ax2.bar(all_question_nums, [1]*len(all_question_nums), color=colors_bar, 
                       alpha=0.8, edgecolor='white', linewidth=2)
        
        for i, (bar, correct) in enumerate(zip(bars, all_correct_flags)):
            height = bar.get_height()
            symbol = '✓' if correct else '✗'
            ax2.text(bar.get_x() + bar.get_width()/2., height/2,
                    symbol, ha='center', va='center', 
                    fontsize=16, fontweight='bold', color='white')
        
        ax2.set_xticks(all_question_nums)
        ax2.set_xlim(0.5, total + 0.5)
        
        print(f"ULTIMATE: Bar chart created with {len(all_question_nums)} bars", file=sys.stderr)
    else:
        # Fallback bars
        ax2.text(0.5, 0.5, 'No Question Data\nAvailable', 
                ha='center', va='center', transform=ax2.transAxes,
                fontsize=14, color='red')
        print("ULTIMATE: No question data, showing fallback message", file=sys.stderr)
    
    ax2.set_xlabel('Question Number', fontsize=12, fontweight='bold')
    ax2.set_ylabel('Result', fontsize=12, fontweight='bold')
    ax2.set_title('Question-wise Performance - ULTIMATE', fontsize=14, fontweight='bold')
    ax2.set_ylim(-0.1, 1.2)
    ax2.grid(axis='y', alpha=0.3)
    
    # Save with maximum compatibility
    plot_path = r'C:\\Users\\sunny\\OneDrive\\Desktop\\quiz-kro\\quiz-arena\\Quiz-App\\quiz_results\\cpp_level2_ultimate_68b131107120dad9e358d0fa_2025-08-29T07_38_28_252Z_1756453113025.png'
    print(f"ULTIMATE: Saving to: {plot_path}", file=sys.stderr)
    
    plt.tight_layout(pad=3.0)
    plt.savefig(plot_path, dpi=200, bbox_inches='tight', 
                facecolor='white', edgecolor='none', format='png')
    plt.close()
    
    # Verify creation
    if os.path.exists(plot_path):
        file_size = os.path.getsize(plot_path)
        print(f"✅ ULTIMATE SUCCESS: C++ Level 2 graph saved: {file_size} bytes", file=sys.stderr)
        print(json.dumps({"success": True, "filename": "cpp_level2_ultimate_68b131107120dad9e358d0fa_2025-08-29T07_38_28_252Z_1756453113025.png"}))
    else:
        raise FileNotFoundError("ULTIMATE FAILURE: Plot file was not created")
    
except Exception as e:
    import traceback
    print(f"❌ ULTIMATE ERROR: {e}", file=sys.stderr)
    print(traceback.format_exc(), file=sys.stderr)
    print(json.dumps({"success": False, "error": str(e)}))
